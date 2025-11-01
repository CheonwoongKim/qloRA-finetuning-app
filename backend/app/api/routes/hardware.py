from fastapi import APIRouter
import psutil
import platform
import subprocess
import json
from datetime import datetime
from typing import Optional

try:
    import GPUtil
    GPU_AVAILABLE = True
except ImportError:
    GPU_AVAILABLE = False

router = APIRouter()


def get_apple_silicon_gpu_info():
    """Get GPU info for Apple Silicon Macs"""
    try:
        # Get system info to detect Apple Silicon
        machine = platform.machine()
        if machine != 'arm64':
            return None

        # Get GPU info using system_profiler
        result = subprocess.run(
            ['system_profiler', 'SPDisplaysDataType', '-json'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return None

        data = json.loads(result.stdout)

        # Extract GPU information
        gpu_info = None
        if 'SPDisplaysDataType' in data:
            for display in data['SPDisplaysDataType']:
                if 'sppci_model' in display:
                    gpu_name = display['sppci_model']
                    # For Apple Silicon, memory is shared with system
                    memory = psutil.virtual_memory()

                    gpu_info = {
                        'id': 0,
                        'name': gpu_name,
                        'load': 0,  # Apple Silicon doesn't easily expose GPU usage
                        'memory_used': memory.used / (1024**3),  # Shared memory
                        'memory_total': memory.total / (1024**3),
                        'memory_util': memory.percent,
                        'temperature': 0  # Requires additional tools
                    }
                    break

        return gpu_info
    except Exception as e:
        print(f"Error getting Apple Silicon GPU info: {e}")
        return None


def get_macos_disk_info():
    """Get accurate disk info for macOS using diskutil"""
    try:
        # Get diskutil info for root volume
        result = subprocess.run(
            ['diskutil', 'info', '-plist', '/'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return None

        # Parse plist output
        import plistlib
        data = plistlib.loads(result.stdout.encode())

        # Get Container information (more accurate for APFS)
        container_total = data.get('APFSContainerSize', data.get('IOKitSize', 0))
        container_free = data.get('APFSContainerFree', data.get('FreeSpace', 0))

        if container_total > 0:
            total_gb = container_total / (1024**3)
            free_gb = container_free / (1024**3)
            used_gb = total_gb - free_gb
            percent = (used_gb / total_gb) * 100

            return {
                'total': round(total_gb, 2),
                'used': round(used_gb, 2),
                'free': round(free_gb, 2),
                'percent': round(percent, 1)
            }

        return None
    except Exception as e:
        print(f"Error getting macOS disk info: {e}")
        return None


@router.get("/stats")
async def get_hardware_stats():
    """Get comprehensive hardware statistics"""

    # CPU information
    cpu_percent = psutil.cpu_percent(interval=1, percpu=False)
    cpu_count = psutil.cpu_count(logical=True)
    cpu_freq = psutil.cpu_freq()

    # Get CPU model - macOS specific method
    cpu_model = "Unknown"
    if platform.system() == 'Darwin':
        try:
            result = subprocess.run(
                ['sysctl', '-n', 'machdep.cpu.brand_string'],
                capture_output=True,
                text=True,
                timeout=2
            )
            if result.returncode == 0:
                cpu_model = result.stdout.strip()
        except Exception:
            pass

    # Fallback to platform methods
    if cpu_model == "Unknown":
        cpu_model = platform.uname().processor or platform.processor() or "Unknown"

    # Memory information
    memory = psutil.virtual_memory()

    # Disk information
    # Try macOS-specific disk info first (more accurate for APFS)
    disk_info = get_macos_disk_info() if platform.system() == 'Darwin' else None

    if disk_info:
        disk_data = disk_info
    else:
        # Fall back to psutil for other systems
        disk = psutil.disk_usage('/')
        disk_data = {
            "total": round(disk.total / (1024**3), 2),
            "used": round(disk.used / (1024**3), 2),
            "free": round(disk.free / (1024**3), 2),
            "percent": round(disk.percent, 1)
        }

    # GPU information
    gpu_info = []

    # Try Apple Silicon GPU first
    apple_gpu = get_apple_silicon_gpu_info()
    if apple_gpu:
        gpu_info.append(apple_gpu)
    # Otherwise try NVIDIA GPUs
    elif GPU_AVAILABLE:
        try:
            gpus = GPUtil.getGPUs()
            for gpu in gpus:
                gpu_info.append({
                    "id": gpu.id,
                    "name": gpu.name,
                    "load": round(gpu.load * 100, 1),
                    "memory_used": round(gpu.memoryUsed, 1),
                    "memory_total": round(gpu.memoryTotal, 1),
                    "memory_util": round(gpu.memoryUtil * 100, 1),
                    "temperature": gpu.temperature
                })
        except Exception as e:
            print(f"Error getting GPU info: {e}")

    return {
        "timestamp": datetime.now().isoformat(),
        "cpu": {
            "usage": round(cpu_percent, 1),
            "cores": cpu_count,
            "frequency": round(cpu_freq.current, 0) if cpu_freq else None,
            "model": cpu_model
        },
        "memory": {
            "total": round(memory.total / (1024**3), 2),  # GB
            "used": round(memory.used / (1024**3), 2),  # GB
            "available": round(memory.available / (1024**3), 2),  # GB
            "percent": round(memory.percent, 1)
        },
        "disk": disk_data,
        "gpu": gpu_info
    }


@router.get("/system-info")
async def get_system_info():
    """Get system information"""

    uname = platform.uname()

    # Get Python version
    python_version = platform.python_version()

    # Get boot time
    boot_time = datetime.fromtimestamp(psutil.boot_time())

    return {
        "system": uname.system,
        "node_name": uname.node,
        "release": uname.release,
        "version": uname.version,
        "machine": uname.machine,
        "processor": uname.processor,
        "python_version": python_version,
        "boot_time": boot_time.isoformat()
    }


@router.get("/cpu")
async def get_cpu_stats():
    """Get detailed CPU statistics"""

    cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
    cpu_freq = psutil.cpu_freq(percpu=False)

    return {
        "usage_total": round(psutil.cpu_percent(interval=0.1), 1),
        "usage_per_core": [round(p, 1) for p in cpu_percent],
        "cores_logical": psutil.cpu_count(logical=True),
        "cores_physical": psutil.cpu_count(logical=False),
        "frequency": {
            "current": round(cpu_freq.current, 0) if cpu_freq else None,
            "min": round(cpu_freq.min, 0) if cpu_freq and cpu_freq.min > 0 else None,
            "max": round(cpu_freq.max, 0) if cpu_freq and cpu_freq.max > 0 else None
        }
    }


@router.get("/memory")
async def get_memory_stats():
    """Get detailed memory statistics"""

    memory = psutil.virtual_memory()
    swap = psutil.swap_memory()

    return {
        "virtual": {
            "total": round(memory.total / (1024**3), 2),
            "available": round(memory.available / (1024**3), 2),
            "used": round(memory.used / (1024**3), 2),
            "percent": round(memory.percent, 1)
        },
        "swap": {
            "total": round(swap.total / (1024**3), 2),
            "used": round(swap.used / (1024**3), 2),
            "free": round(swap.free / (1024**3), 2),
            "percent": round(swap.percent, 1)
        }
    }


@router.get("/gpu")
async def get_gpu_stats():
    """Get GPU statistics"""

    # Try Apple Silicon GPU first
    apple_gpu = get_apple_silicon_gpu_info()
    if apple_gpu:
        return {
            "available": True,
            "count": 1,
            "gpus": [{
                "id": apple_gpu["id"],
                "name": apple_gpu["name"],
                "driver": "Apple",
                "load": apple_gpu["load"],
                "memory": {
                    "used": round(apple_gpu["memory_used"], 1),
                    "total": round(apple_gpu["memory_total"], 1),
                    "free": round(apple_gpu["memory_total"] - apple_gpu["memory_used"], 1),
                    "util": round(apple_gpu["memory_util"], 1)
                },
                "temperature": apple_gpu["temperature"],
                "uuid": "apple-silicon-gpu"
            }]
        }

    # Try NVIDIA GPUs
    if not GPU_AVAILABLE:
        return {
            "available": False,
            "message": "GPUtil not available"
        }

    try:
        gpus = GPUtil.getGPUs()

        if not gpus:
            return {
                "available": True,
                "count": 0,
                "gpus": [],
                "message": "No GPU detected"
            }

        gpu_list = []
        for gpu in gpus:
            gpu_list.append({
                "id": gpu.id,
                "name": gpu.name,
                "driver": gpu.driver,
                "load": round(gpu.load * 100, 1),
                "memory": {
                    "used": round(gpu.memoryUsed, 1),
                    "total": round(gpu.memoryTotal, 1),
                    "free": round(gpu.memoryFree, 1),
                    "util": round(gpu.memoryUtil * 100, 1)
                },
                "temperature": gpu.temperature,
                "uuid": gpu.uuid
            })

        return {
            "available": True,
            "count": len(gpus),
            "gpus": gpu_list
        }
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }


@router.get("/disk")
async def get_disk_stats():
    """Get disk statistics for all partitions"""

    partitions = psutil.disk_partitions()
    disk_list = []

    for partition in partitions:
        try:
            usage = psutil.disk_usage(partition.mountpoint)
            disk_list.append({
                "device": partition.device,
                "mountpoint": partition.mountpoint,
                "fstype": partition.fstype,
                "total": round(usage.total / (1024**3), 2),
                "used": round(usage.used / (1024**3), 2),
                "free": round(usage.free / (1024**3), 2),
                "percent": round(usage.percent, 1)
            })
        except PermissionError:
            # Skip partitions we don't have permission to access
            continue

    return {
        "partitions": disk_list
    }

import os
import multiprocessing
import logging
import socket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return False
        except socket.error:
            return True

# Get port from environment variable with validation
try:
    port = int(os.environ.get('PORT', '5001'))  # Default to 5001
    if port < 1 or port > 65535:
        raise ValueError(f"Invalid port number: {port}")
    
    logger.info(f"Using port: {port}")
except Exception as e:
    logger.error(f"Error with PORT environment variable: {str(e)}")
    port = 5001  # Fallback to 5001
    logger.info(f"Falling back to default port: {port}")

# Check if we're on Render free tier
is_free_tier = os.environ.get('RENDER_SERVICE_PLAN', '').lower() == 'free'

# For free tier, use minimal resources
if is_free_tier:
    workers = 1
    threads = 1
    max_requests = 10
    max_requests_jitter = 2
    worker_class = 'sync'
    timeout = 120
else:
    # For paid tier, use more resources as needed
    workers = 1
    threads = 2
    max_requests = 50
    max_requests_jitter = 5
    worker_class = 'sync'
    timeout = 120

# Timeouts
graceful_timeout = 30  # 30 seconds

# Disable preload to reduce memory usage
preload_app = True

# Set worker temporary directory
worker_tmp_dir = '/dev/shm'

# Maximum worker lifetime
max_worker_lifetime = 600  # 10 minutes

# Worker connections
worker_connections = 10  # Reduce from default to save memory

# Memory limits
worker_max_memory = 50 * 1024 * 1024  # 50MB
worker_max_memory_percent = 50  # 50% of available memory

# Logging
accesslog = '-'  # log to stdout
errorlog = '-'   # log to stderr
loglevel = 'info'

# Worker class settings
worker_connections = 50  # Reduced connections to minimize memory usage

# Memory limits
worker_max_memory = 100 * 1024 * 1024  # 100MB in bytes
worker_max_memory_percent = 70  # 70% of available memory

def on_starting(server):
    """Log when server starts"""
    print(f"Starting gunicorn with {workers} workers and {threads} threads")
    print(f"Service plan: {os.environ.get('RENDER_SERVICE_PLAN', 'unknown')}")
    print(f"PORT: {os.environ.get('PORT', 'not set')}")
    
    # Set environment variables for resource constraints
    if is_free_tier:
        os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
        os.environ['TF_MEMORY_ALLOCATION'] = '256MB'

def post_fork(server, worker):
    """Run after worker processes are forked"""
    import gc
    gc.collect()

def pre_request(worker, req):
    """Run before each request"""
    import gc
    gc.collect()

# Memory optimization for ML workloads
worker_connections = 10  # Reduce from default to save memory 
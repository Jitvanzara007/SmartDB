"""
Production settings for Smart_DB project on PythonAnywhere.
"""

from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Update ALLOWED_HOSTS for PythonAnywhere
ALLOWED_HOSTS = [
    'Jitvanzara007.pythonanywhere.com',
    'www.Jitvanzara007.pythonanywhere.com',
    'localhost',
    '127.0.0.1',
    'smart-db-omega.vercel.app',
    '.vercel.app',
]

# Update CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://smart-db-omega.vercel.app",
    "https://smart-db-omega-git-main.vercel.app",
    "https://smart-db-omega-git-master.vercel.app",
    "http://localhost:3000",  # For local development
    "http://127.0.0.1:3000",  # For local development
]

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Use environment variables for sensitive data
import os

SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/SmartDB')

# Reconnect to MongoDB with production settings
from mongoengine import disconnect, connect
disconnect()
connect(host=MONGODB_URI)

# Static files configuration for PythonAnywhere
STATIC_URL = '/static/'
STATIC_ROOT = '/home/Jitvanzara007/Smart_DB/staticfiles'

# Media files (if needed)
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/Jitvanzara007/Smart_DB/media' 
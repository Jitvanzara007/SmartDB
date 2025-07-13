# PythonAnywhere Deployment Guide

## Step 1: Upload Your Code

1. **Upload your project files** to PythonAnywhere:
   - Go to your PythonAnywhere dashboard
   - Navigate to the Files tab
   - Create a directory: `/home/Jitvanzara007/Smart_DB/`
   - Upload all your project files to this directory

## Step 2: Set Up Virtual Environment

1. **Open a Bash console** in PythonAnywhere
2. **Navigate to your project directory**:
   ```bash
   cd /home/Jitvanzara007/Smart_DB
   ```
3. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   ```
4. **Activate the virtual environment**:
   ```bash
   source venv/bin/activate
   ```
5. **Install requirements**:
   ```bash
   pip install -r requirements.txt
   ```

## Step 3: Configure WSGI File

1. **Go to the Web tab** in PythonAnywhere
2. **Click on your web app** (or create a new one)
3. **Click on the WSGI configuration file**
4. **Replace the content** with the `wsgi.py` file we created
5. **Save the file**

## Step 4: Set Environment Variables

1. **Go to the Web tab**
2. **Click on your web app**
3. **Go to the Environment variables section**
4. **Add these variables**:
   ```
   SECRET_KEY=your_new_secret_key_here
   MONGODB_URI=your_mongodb_atlas_connection_string
   DJANGO_SETTINGS_MODULE=smart_db.settings_production
   ```

## Step 5: Collect Static Files

1. **Open a Bash console**
2. **Navigate to your project**:
   ```bash
   cd /home/Jitvanzara007/Smart_DB
   source venv/bin/activate
   ```
3. **Collect static files**:
   ```bash
   python manage.py collectstatic --noinput
   ```

## Step 6: Configure Web App

1. **Go to the Web tab**
2. **Set the source code directory** to: `/home/Jitvanzara007/Smart_DB`
3. **Set the working directory** to: `/home/Jitvanzara007/Smart_DB`
4. **Set the WSGI configuration file** to use our custom `wsgi.py`

## Step 7: Update Frontend Environment Variable

In your Vercel project, update the environment variable:
```
VITE_API_BASE_URL=https://Jitvanzara007.pythonanywhere.com
```

## Step 8: Reload Web App

1. **Go to the Web tab**
2. **Click the "Reload" button** for your web app

## Troubleshooting

### Common Issues:

1. **Import Errors**: Make sure all packages are installed in your virtual environment
2. **MongoDB Connection**: Ensure your MongoDB Atlas connection string is correct
3. **Static Files**: Make sure static files are collected and served properly
4. **CORS Errors**: Check that your Vercel domain is in the CORS_ALLOWED_ORIGINS

### Useful Commands:

```bash
# Check Django configuration
python manage.py check

# Test the server locally
python manage.py runserver

# View logs
tail -f /var/log/user/Jitvanzara007.pythonanywhere.com.error.log
```

## File Structure on PythonAnywhere

Your project should look like this:
```
/home/Jitvanzara007/Smart_DB/
├── manage.py
├── requirements.txt
├── wsgi.py
├── smart_db/
│   ├── __init__.py
│   ├── settings.py
│   ├── settings_production.py
│   ├── urls.py
│   └── wsgi.py
├── training/
├── accounts/
├── staticfiles/
└── venv/
```

## Security Notes

1. **Never commit sensitive data** like SECRET_KEY or MONGODB_URI to version control
2. **Use environment variables** for all sensitive configuration
3. **Keep DEBUG=False** in production
4. **Regularly update dependencies** for security patches 
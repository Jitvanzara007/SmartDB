# Smart_DB: Training Platform

A full-stack training platform for instructors and trainees, built with Django (backend) and React (frontend).

---

## Quick Setup

1. **Clone:**
   ```bash
   git clone https://github.com/your-username/Smart_DB.git
   cd Smart_DB
   ```
2. **Backend:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # or: source venv/bin/activate  # On Mac/Linux
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. **Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API framework
- **Djongo** - MongoDB connector for Django
- **PyMongo** - MongoDB driver
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS handling

### Frontend
- **React 19.1.0** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Bootstrap 5.3.2** - CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Chart.js & react-chartjs-2** - Data visualization

### Database
- **MongoDB** - NoSQL database

## Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/token/refresh/` - Refresh JWT token

### User Management
- `GET /api/user/profile/` - Get user profile
- `PUT /api/user/profile/` - Update user profile
- `POST /api/user/change-password/` - Change password

### Training Modules
- `GET /api/modules/` - List all modules (instructors only)
- `POST /api/modules/` - Create new module (instructors only)
- `GET /api/modules/{id}/` - Get module details
- `PUT /api/modules/{id}/` - Update module (instructors only)
- `DELETE /api/modules/{id}/` - Delete module (instructors only)

### Module Assignments
- `GET /api/assignments/` - List assignments (instructors only)
- `POST /api/assignments/` - Create assignment (instructors only)
- `GET /api/assignments/{id}/` - Get assignment details
- `PUT /api/assignments/{id}/` - Update assignment
- `DELETE /api/assignments/{id}/` - Delete assignment

### Dashboards
- `GET /api/dashboard/trainee/` - Trainee dashboard data
- `GET /api/dashboard/instructor/` - Instructor dashboard data

### Trainee-specific
- `GET /api/trainee/modules/` - Get trainee's assigned modules
- `POST /api/trainee/complete/{id}/` - Mark module as completed

### Instructor-specific
- `GET /api/instructor/trainees/` - List all trainees
- `GET /api/instructor/trainees/{id}/progress/` - Get trainee progress

## Usage

### Getting Started

1. **Register an Account**
   - Visit the registration page
   - Choose your role (Trainee or Instructor)
   - Fill in your details and create account

2. **Login**
   - Use your credentials to log in
   - You'll be redirected to your role-specific dashboard

3. **Trainee Features**
   - View assigned training modules
   - Mark modules as completed
   - Track your progress with visual charts
   - Update your profile information

4. **Instructor Features**
   - Create and manage training modules
   - Assign modules to trainees
   - Track trainee progress
   - View analytics and reports

### Creating Training Modules (Instructors)

1. Navigate to "Manage Modules" in the sidebar
2. Click "Create New Module"
3. Fill in module details (title, description, content, duration)
4. Save the module

### Assigning Modules to Trainees (Instructors)

1. Navigate to "Manage Trainees"
2. Select a trainee
3. Click "Assign Module"
4. Choose the module and assign it

### Marking Modules Complete (Trainees)

1. View your assigned modules on the dashboard
2. Click "Mark Complete" on any module you've finished
3. Your progress will be updated automatically

## Project Structure

```
Smart_DB/
├── smart_db/                 # Django project settings
├── training/                 # Main Django app
│   ├── models.py            # Database models
│   ├── views.py             # API views
│   ├── serializers.py       # Data serializers
│   ├── urls.py              # URL patterns
│   └── admin.py             # Admin interface
├── accounts/                 # Accounts app (placeholder)
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   ├── layout/      # Layout components
│   │   │   └── profile/     # Profile components
│   │   ├── contexts/        # React contexts
│   │   └── App.jsx          # Main app component
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── requirements.txt          # Python dependencies
├── manage.py                # Django management script
└── README.md               # This file
```

## Deployment

### Backend Deployment (Django)

1. **Set Environment Variables**
   ```bash
   export DEBUG=False
   export SECRET_KEY=your-secret-key
   export DATABASE_URL=your-mongodb-url
   ```

2. **Collect Static Files**
   ```bash
   python manage.py collectstatic
   ```

3. **Deploy to Platform**
   - **Heroku**: Use Heroku CLI
   - **Railway**: Connect GitHub repository
   - **Render**: Deploy from Git repository

### Frontend Deployment (React)

1. **Build for Production**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Platform**
   - **Vercel**: Connect GitHub repository
   - **Netlify**: Drag and drop build folder
   - **GitHub Pages**: Use GitHub Actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

## Demo

A live demo is available at: [Demo URL will be added after deployment]

---

**Note**: This is a development version. For production use, ensure proper security measures, environment variables, and database backups are in place. 
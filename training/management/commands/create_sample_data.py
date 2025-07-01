from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from training.models import TrainingModule, ModuleAssignment
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample training modules and assignments for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create sample training modules
        modules_data = [
            {
                'title': 'Introduction to Web Development',
                'description': 'Learn the basics of HTML, CSS, and JavaScript. This module covers fundamental web development concepts and best practices.',
                'content': 'This is a comprehensive introduction to web development...',
                'duration_minutes': 120
            },
            {
                'title': 'React Fundamentals',
                'description': 'Master React.js basics including components, state, props, and hooks. Build interactive user interfaces.',
                'content': 'React is a powerful JavaScript library for building user interfaces...',
                'duration_minutes': 180
            },
            {
                'title': 'Database Design Principles',
                'description': 'Learn database design, normalization, and SQL fundamentals. Understand how to structure data effectively.',
                'content': 'Database design is crucial for building scalable applications...',
                'duration_minutes': 150
            },
            {
                'title': 'API Development with Django',
                'description': 'Build RESTful APIs using Django REST Framework. Learn authentication, serialization, and best practices.',
                'content': 'Django REST Framework makes it easy to build powerful APIs...',
                'duration_minutes': 200
            },
            {
                'title': 'DevOps Basics',
                'description': 'Introduction to DevOps practices, CI/CD pipelines, and deployment strategies.',
                'content': 'DevOps bridges the gap between development and operations...',
                'duration_minutes': 160
            }
        ]
        
        # Get or create an instructor
        instructor, created = User.objects.get_or_create(
            username='instructor',
            defaults={
                'email': 'instructor@example.com',
                'role': 'instructor',
                'is_staff': True
            }
        )
        if created:
            instructor.set_password('password123')
            instructor.save()
            self.stdout.write(f'Created instructor: {instructor.username}')
        
        # Create training modules
        created_modules = []
        for module_data in modules_data:
            module, created = TrainingModule.objects.get_or_create(
                title=module_data['title'],
                defaults={
                    'description': module_data['description'],
                    'content': module_data['content'],
                    'duration_minutes': module_data['duration_minutes'],
                    'created_by': instructor,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Created module: {module.title}')
            created_modules.append(module)
        
        # Get all trainees
        trainees = User.objects.filter(role='trainee', is_active=True)
        
        if not trainees.exists():
            self.stdout.write('No trainees found. Creating a sample trainee...')
            trainee = User.objects.create_user(
                username='trainee',
                email='trainee@example.com',
                password='password123',
                role='trainee'
            )
            trainees = [trainee]
            self.stdout.write(f'Created trainee: {trainee.username}')
        
        # Assign modules to trainees
        for trainee in trainees:
            for i, module in enumerate(created_modules):
                assignment, created = ModuleAssignment.objects.get_or_create(
                    trainee=trainee,
                    module=module,
                    defaults={
                        'assigned_by': instructor,
                        'is_completed': i < 2  # First 2 modules completed
                    }
                )
                if created:
                    self.stdout.write(f'Assigned {module.title} to {trainee.username}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(created_modules)} modules and assigned them to {trainees.count()} trainees'
            )
        )
        
        # Print login credentials
        self.stdout.write('\nLogin Credentials:')
        self.stdout.write('Instructor: username=instructor, password=password123')
        self.stdout.write('Trainee: username=trainee, password=password123') 
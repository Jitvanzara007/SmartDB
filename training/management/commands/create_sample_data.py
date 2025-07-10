from django.core.management.base import BaseCommand
from training.models import User, TrainingModule, ModuleAssignment
from datetime import datetime

class Command(BaseCommand):
    help = 'Create initial training modules and sample assignments.'

    def handle(self, *args, **options):
        # Create or fetch a sample instructor
        instructor = User.objects(username='sampleinstructor').first()
        if not instructor:
            instructor = User(
                username='sampleinstructor',
                email='sampleinstructor@example.com',
                role='instructor',
                is_active=True,
                password='samplepassword'
            )
            instructor.save()

        # Create 6 modules
        module_titles = [
            'Introduction to Smart DB',
            'Data Modeling Basics',
            'Advanced Query Techniques',
            'Performance Optimization',
            'Security Best Practices',
            'Backup and Recovery'
        ]
        modules = []
        for title in module_titles:
            module = TrainingModule.objects(title=title).first()
            if not module:
                module = TrainingModule(
                    title=title,
                    description=f'{title} - Learn about {title.lower()}',
                    is_active=True,
                    created_by=instructor
                )
                module.save()
            modules.append(module)
        self.stdout.write(self.style.SUCCESS('Created/verified 6 training modules.'))

        # Create a sample user (trainee)
        user = User.objects(username='sampletrainee').first()
        if not user:
            user = User(
                username='sampletrainee',
                email='sampletrainee@example.com',
                role='trainee',
                is_active=True,
                password='samplepassword'  # You may want to hash this
            )
            user.save()
        self.stdout.write(self.style.SUCCESS('Created/verified sample trainee user.'))

        # Assign modules to the user, mark some as completed
        for i, module in enumerate(modules):
            assignment = ModuleAssignment.objects(trainee=user, module=module).first()
            if not assignment:
                assignment = ModuleAssignment(
                    trainee=user,
                    module=module,
                    assigned_by=instructor,
                    is_completed=i < 3,  # First 3 completed, rest incomplete
                    assigned_at=datetime.now(),
                    completed_at=datetime.now() if i < 3 else None
                )
                assignment.save()
        self.stdout.write(self.style.SUCCESS('Assigned modules to sample trainee (3 completed, 3 incomplete).')) 
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('instructor', 'Instructor'),
        ('trainee', 'Trainee'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='trainee')
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

class TrainingModule(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    content = models.TextField()
    duration_minutes = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_modules')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'training_modules'

    def __str__(self):
        return self.title

class ModuleAssignment(models.Model):
    trainee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_modules')
    module = models.ForeignKey(TrainingModule, on_delete=models.CASCADE, related_name='assignments')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments_made')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'module_assignments'
        unique_together = ['trainee', 'module']

    def __str__(self):
        return f"{self.trainee.username} - {self.module.title}"

    def mark_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()

class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender.username} to {self.recipient.username}: {self.content[:30]}" 
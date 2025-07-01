from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TrainingModule, ModuleAssignment

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'created_at')
    search_fields = ('username', 'email')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role',)}),
    )

@admin.register(TrainingModule)
class TrainingModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'duration_minutes', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'created_by')
    search_fields = ('title', 'description')
    ordering = ('-created_at',)

@admin.register(ModuleAssignment)
class ModuleAssignmentAdmin(admin.ModelAdmin):
    list_display = ('trainee', 'module', 'assigned_by', 'is_completed', 'assigned_at')
    list_filter = ('is_completed', 'assigned_at', 'assigned_by')
    search_fields = ('trainee__username', 'module__title')
    ordering = ('-assigned_at',) 
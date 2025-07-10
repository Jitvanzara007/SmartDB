from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, UserProfileView, ChangePasswordView,
    TrainingModuleListCreateView, TrainingModuleDetailView,
    ModuleAssignmentListCreateView, ModuleAssignmentDetailView,
    TraineeDashboardView, InstructorDashboardView,
    TraineeModuleListView, MarkModuleCompletedView,
    TraineeListView, TraineeProgressView, BulkAssignModuleView, TraineeDeleteView, MessageInstructorView, InstructorMessagesView, InstructorReplyView, TraineeMessagesView,
    SuperAdminDashboardView, UserListView, UserCreateView, UserUpdateView, UserDeleteView
)

urlpatterns = [
    # Authentication
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # User Management
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),
    path('user/change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # Training Modules
    path('modules/', TrainingModuleListCreateView.as_view(), name='module-list-create'),
    path('modules/<str:pk>/', TrainingModuleDetailView.as_view(), name='module-detail'),
    
    # Module Assignments
    path('assignments/', ModuleAssignmentListCreateView.as_view(), name='assignment-list-create'),
    path('assignments/<int:pk>/', ModuleAssignmentDetailView.as_view(), name='assignment-detail'),
    
    # Dashboards
    path('dashboard/trainee/', TraineeDashboardView.as_view(), name='trainee-dashboard'),
    path('dashboard/instructor/', InstructorDashboardView.as_view(), name='instructor-dashboard'),
    path('dashboard/superadmin/', SuperAdminDashboardView.as_view(), name='superadmin-dashboard'),
    
    # Trainee-specific
    path('trainee/modules/', TraineeModuleListView.as_view(), name='trainee-modules'),
    path('trainee/complete/<int:assignment_id>/', MarkModuleCompletedView.as_view(), name='mark-completed'),
    
    # Instructor-specific
    path('trainees/', TraineeListView.as_view(), name='trainee-list'),
    path('trainees/<str:trainee_id>/delete/', TraineeDeleteView.as_view(), name='trainee-delete'),
    path('instructor/trainees/<int:trainee_id>/progress/', TraineeProgressView.as_view(), name='trainee-progress'),

    path('modules/<str:module_id>/assign/', BulkAssignModuleView.as_view(), name='bulk-assign-module'),

    path('messages/send/', MessageInstructorView.as_view(), name='message-instructor'),
    path('messages/inbox/', InstructorMessagesView.as_view(), name='instructor-messages'),
    path('messages/<int:message_id>/reply/', InstructorReplyView.as_view(), name='instructor-reply'),
    path('messages/my/', TraineeMessagesView.as_view(), name='trainee-messages'),

    path('superadmin/users/', UserListView.as_view(), name='superadmin-user-list'),
    path('superadmin/users/create/', UserCreateView.as_view(), name='superadmin-user-create'),
    path('superadmin/users/<int:user_id>/edit/', UserUpdateView.as_view(), name='superadmin-user-edit'),
    path('superadmin/users/<int:user_id>/delete/', UserDeleteView.as_view(), name='superadmin-user-delete'),
] 
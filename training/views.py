from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Count, Q
from django.utils import timezone
from .models import User, TrainingModule, ModuleAssignment, Message
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LoginSerializer, TrainingModuleSerializer,
    TrainingModuleCreateSerializer, ModuleAssignmentSerializer,
    ModuleAssignmentCreateSerializer, TraineeDashboardSerializer,
    InstructorDashboardSerializer, MessageSerializer
)

class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        print(f"IsInstructor permission check - User: {request.user.username}, Role: {request.user.role}")
        return request.user.role == 'instructor'

class IsTrainee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'trainee'

# Authentication Views
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Error logging out"}, status=status.HTTP_400_BAD_REQUEST)

# User Management Views
class UserProfileView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(request.user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.validated_data['old_password']):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({"message": "Password changed successfully"})
            return Response({"error": "Invalid old password"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Training Module Views
class TrainingModuleListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingModuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'instructor':
            return TrainingModule.objects.filter(is_active=True)
        return TrainingModule.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TrainingModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TrainingModule.objects.all()
    serializer_class = TrainingModuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

# Module Assignment Views
class ModuleAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = ModuleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def get_queryset(self):
        print("ModuleAssignmentListCreateView.get_queryset called")
        queryset = ModuleAssignment.objects.all()
        module_id = self.request.query_params.get('module_id')
        print(f"Module ID from query params: {module_id}")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        print(f"Returning {queryset.count()} assignments")
        return queryset
    
    def perform_create(self, serializer):
        print(f"Creating assignment: {serializer.validated_data}")
        serializer.save(assigned_by=self.request.user)

class ModuleAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ModuleAssignment.objects.all()
    serializer_class = ModuleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

# Dashboard Views
class TraineeDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTrainee]
    
    def get(self, request):
        user = request.user
        assignments = ModuleAssignment.objects.filter(trainee=user)
        
        total_assigned = assignments.count()
        completed = assignments.filter(is_completed=True).count()
        pending = total_assigned - completed
        completion_percentage = (completed / total_assigned * 100) if total_assigned > 0 else 0
        
        progress = {
            'total_assigned': total_assigned,
            'completed': completed,
            'pending': pending,
            'completion_percentage': round(completion_percentage, 2)
        }
        
        assigned_modules = []
        for assignment in assignments:
            assigned_modules.append({
                'id': assignment.id,
                'module': TrainingModuleSerializer(assignment.module).data,
                'is_completed': assignment.is_completed,
                'assigned_at': assignment.assigned_at,
                'completed_at': assignment.completed_at
            })
        
        dashboard_data = {
            'user': UserSerializer(user).data,
            'progress': progress,
            'assigned_modules': assigned_modules
        }
        
        serializer = TraineeDashboardSerializer(dashboard_data)
        return Response(serializer.data)

class InstructorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def get(self, request):
        trainees = User.objects.filter(role='trainee', is_active=True)
        modules = TrainingModule.objects.all()
        assignments = ModuleAssignment.objects.all()

        # Module stats
        module_stats = []
        assigned_modules_count = 0
        unassigned_modules_count = 0
        for module in modules:
            module_assignments = assignments.filter(module=module)
            assigned_count = module_assignments.count()
            completed_count = module_assignments.filter(is_completed=True).count()
            completion_rate = (completed_count / assigned_count * 100) if assigned_count > 0 else 0
            if assigned_count > 0:
                assigned_modules_count += 1
            else:
                unassigned_modules_count += 1
            module_stats.append({
                'id': module.id,
                'title': module.title,
                'assigned_count': assigned_count,
                'completed_count': completed_count,
                'completion_rate': round(completion_rate, 2),
            })

        # Trainee stats
        trainee_stats = []
        progress_buckets = {0: 0, 25: 0, 50: 0, 75: 0, 100: 0}
        for trainee in trainees:
            trainee_assignments = assignments.filter(trainee=trainee)
            total = trainee_assignments.count()
            completed = trainee_assignments.filter(is_completed=True).count()
            completion_percentage = int(round((completed / total * 100), 0)) if total > 0 else 0
            # Bucket to nearest 0, 25, 50, 75, 100
            if completion_percentage == 100:
                bucket = 100
            elif completion_percentage >= 75:
                bucket = 75
            elif completion_percentage >= 50:
                bucket = 50
            elif completion_percentage >= 25:
                bucket = 25
            else:
                bucket = 0
            progress_buckets[bucket] += 1
            trainee_stats.append({
                'id': trainee.id,
                'username': trainee.username,
                'completion_percentage': completion_percentage,
            })

        # Assignment status summary
        total_assignments = assignments.count()
        completed_assignments = assignments.filter(is_completed=True).count()
        in_progress_assignments = assignments.filter(is_completed=False).exclude(completed_at=None).count()
        not_started_assignments = assignments.filter(is_completed=False, completed_at=None).count()
        assignment_status_summary = {
            'completed': completed_assignments,
            'in_progress': in_progress_assignments,
            'not_started': not_started_assignments,
            'total': total_assignments
        }

        dashboard_data = {
            'total_trainees': trainees.count(),
            'total_modules': modules.count(),
            'assigned_modules_count': assigned_modules_count,
            'unassigned_modules_count': unassigned_modules_count,
            'trainees': trainee_stats,
            'modules': module_stats,
            'progress_distribution': progress_buckets,
            'assignment_status_summary': assignment_status_summary,
        }
        return Response(dashboard_data)

# Trainee-specific Views
class TraineeModuleListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTrainee]
    
    def get(self, request):
        assignments = ModuleAssignment.objects.filter(trainee=request.user)
        serializer = ModuleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

class MarkModuleCompletedView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTrainee]
    
    def post(self, request, assignment_id):
        try:
            assignment = ModuleAssignment.objects.get(
                id=assignment_id, 
                trainee=request.user
            )
            assignment.mark_completed()
            serializer = ModuleAssignmentSerializer(assignment)
            return Response(serializer.data)
        except ModuleAssignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

# Instructor-specific Views
class TraineeListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def get(self, request):
        print("TraineeListView called")
        print(f"User: {request.user.username}, Role: {request.user.role}")
        trainees = User.objects.filter(role='trainee', is_active=True)
        print(f"Found {trainees.count()} trainees")
        serializer = UserSerializer(trainees, many=True)
        print(f"Serialized data: {serializer.data}")
        return Response(serializer.data)

class TraineeProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructor]
    
    def get(self, request, trainee_id):
        try:
            trainee = User.objects.get(id=trainee_id, role='trainee')
            assignments = ModuleAssignment.objects.filter(trainee=trainee)
            
            total_assigned = assignments.count()
            completed = assignments.filter(is_completed=True).count()
            pending = total_assigned - completed
            completion_percentage = (completed / total_assigned * 100) if total_assigned > 0 else 0
            
            progress = {
                'trainee': UserSerializer(trainee).data,
                'total_assigned': total_assigned,
                'completed': completed,
                'pending': pending,
                'completion_percentage': round(completion_percentage, 2),
                'assignments': ModuleAssignmentSerializer(assignments, many=True).data
            }
            
            return Response(progress)
        except User.DoesNotExist:
            return Response(
                {"error": "Trainee not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class BulkAssignModuleView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

    def post(self, request, module_id):
        print(f"BulkAssignModuleView called with module_id: {module_id}")
        print(f"Request data: {request.data}")
        print(f"User: {request.user.username}, Role: {request.user.role}")
        print(f"Request headers: {request.headers}")
        
        # Check if user is instructor
        if request.user.role != 'instructor':
            print(f"Permission denied: user role is {request.user.role}")
            return Response({'error': 'Only instructors can assign modules'}, status=status.HTTP_403_FORBIDDEN)
        
        trainee_ids = request.data.get('trainee_ids', [])
        if not isinstance(trainee_ids, list):
            return Response({'error': 'trainee_ids must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not trainee_ids:
            return Response({'error': 'No trainee IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            module = TrainingModule.objects.get(id=module_id)
        except TrainingModule.DoesNotExist:
            return Response({'error': 'Module not found'}, status=status.HTTP_404_NOT_FOUND)
        
        assigned = []
        errors = []
        
        for trainee_id in trainee_ids:
            try:
                trainee = User.objects.get(id=trainee_id, role='trainee')
                assignment, created = ModuleAssignment.objects.get_or_create(
                    trainee=trainee, module=module,
                    defaults={'assigned_by': request.user}
                )
                assigned.append(assignment.id)
                print(f"Assigned trainee {trainee_id} to module {module_id}, created: {created}")
            except User.DoesNotExist:
                errors.append(f"Trainee with ID {trainee_id} not found")
                continue
        
        response_data = {
            'assigned': assigned,
            'total_requested': len(trainee_ids),
            'successfully_assigned': len(assigned)
        }
        
        if errors:
            response_data['errors'] = errors
        
        print(f"Assignment response: {response_data}")
        return Response(response_data, status=status.HTTP_201_CREATED) 

class TraineeDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

    def delete(self, request, trainee_id):
        try:
            trainee = User.objects.get(id=trainee_id, role='trainee')
            trainee.delete()
            return Response({'message': 'Trainee deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'Trainee not found.'}, status=status.HTTP_404_NOT_FOUND)

class MessageInstructorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Only trainees can send messages to their instructor
        if request.user.role != 'trainee':
            return Response({'error': 'Only trainees can send messages.'}, status=status.HTTP_403_FORBIDDEN)
        instructors = User.objects.filter(role='instructor')
        if not instructors.exists():
            return Response({'error': 'No instructor found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            for instructor in instructors:
                Message.objects.create(
                    sender=request.user,
                    recipient=instructor,
                    content=serializer.validated_data['content']
                )
            return Response({'message': 'Message sent to all instructors.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InstructorMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'instructor':
            return Response({'error': 'Only instructors can view messages.'}, status=403)
        messages = Message.objects.filter(recipient=request.user).order_by('-timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class InstructorReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        if request.user.role != 'instructor':
            return Response({'error': 'Only instructors can reply.'}, status=403)
        try:
            original = Message.objects.get(id=message_id, recipient=request.user)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=404)
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required.'}, status=400)
        reply = Message.objects.create(
            sender=request.user,
            recipient=original.sender,
            content=content
        )
        return Response(MessageSerializer(reply).data, status=201)

class TraineeMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'trainee':
            return Response({'error': 'Only trainees can view their messages.'}, status=403)
        messages = Message.objects.filter(recipient=request.user).order_by('-timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data) 
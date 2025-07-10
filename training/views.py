from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
import jwt
from django.conf import settings
from datetime import datetime, timedelta
from django.db.models import Count, Q
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

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'superadmin'

# Helper function to generate JWT tokens

def generate_jwt(user):
    payload = {
        'user_id': str(user.id),
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=1),
        'iat': datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            access = generate_jwt(user)

            # Assign 6 initial modules (3 completed, 3 incomplete)
            from training.models import TrainingModule, ModuleAssignment
            from datetime import datetime
            modules = TrainingModule.objects.order_by('id')[:6]
            for i, module in enumerate(modules):
                assignment = ModuleAssignment(
                    trainee=user,
                    module=module,
                    assigned_by=None,
                    is_completed=i < 3,
                    assigned_at=datetime.utcnow(),
                    completed_at=datetime.utcnow() if i < 3 else None
                )
                assignment.save()

            return Response({
                'user': UserSerializer(user).data,
                'access': access,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            access = generate_jwt(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': access,
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
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def put(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Update fields manually for MongoEngine
            for attr, value in serializer.validated_data.items():
                setattr(user, attr, value)
            user.save()
            return Response(UserSerializer(user).data)
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
class TrainingModuleListCreateView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        modules = TrainingModule.objects(is_active=True)
        serializer = TrainingModuleSerializer(modules, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        serializer = TrainingModuleSerializer(data=request.data)
        if serializer.is_valid():
            module = TrainingModule(**serializer.validated_data)
            module.created_by = user
            module.save()
            return Response(TrainingModuleSerializer(module).data, status=201)
        return Response(serializer.errors, status=400)

class TrainingModuleDetailView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request, pk):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)
        module = TrainingModule.objects(id=pk).first()
        if not module:
            return Response({'error': 'Module not found'}, status=404)
        serializer = TrainingModuleSerializer(module)
        return Response(serializer.data)

    def put(self, request, pk):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)
        module = TrainingModule.objects(id=pk).first()
        if not module:
            return Response({'error': 'Module not found'}, status=404)
        data = request.data
        module.title = data.get('title', module.title)
        module.description = data.get('description', module.description)
        module.content = data.get('content', module.content)
        module.duration_minutes = data.get('duration_minutes', module.duration_minutes)
        module.is_active = data.get('is_active', module.is_active)
        module.updated_at = datetime.utcnow()
        module.save()
        serializer = TrainingModuleSerializer(module)
        return Response(serializer.data)

    def delete(self, request, pk):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)
        module = TrainingModule.objects(id=pk).first()
        if not module:
            return Response({'error': 'Module not found'}, status=404)
        module.delete()
        return Response({'message': 'Module deleted successfully.'}, status=204)

# Module Assignment Views
class ModuleAssignmentListCreateView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        module_id = request.query_params.get('module_id')
        trainee_id = request.query_params.get('trainee_id')
        queryset = ModuleAssignment.objects
        if module_id:
            queryset = queryset(module=module_id)
        if trainee_id:
            queryset = queryset(trainee=trainee_id)
        assignments = list(queryset)
        serializer = ModuleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        data = request.data
        trainee_id = data.get('trainee_id')
        module_id = data.get('module_id')
        if not trainee_id or not module_id:
            return Response({'error': 'trainee_id and module_id are required'}, status=400)
        trainee = User.objects(id=trainee_id).first()
        module = TrainingModule.objects(id=module_id).first()
        if not trainee or not module:
            return Response({'error': 'Trainee or Module not found'}, status=404)
        assignment = ModuleAssignment(
            trainee=trainee,
            module=module,
            assigned_by=user,
            is_completed=False,
            assigned_at=datetime.utcnow()
        )
        assignment.save()
        serializer = ModuleAssignmentSerializer(assignment)
        return Response(serializer.data, status=201)

class ModuleAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ModuleAssignment.objects.all()
    serializer_class = ModuleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

# Dashboard Views
class TraineeDashboardView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based, so no DRF auth
    
    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        assignments = ModuleAssignment.objects(trainee=user)
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
                'id': str(assignment.id),
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
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        trainees = User.objects(role='trainee', is_active=True)
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
                'id': str(module.id),
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
                'id': str(trainee.id),
                'username': trainee.username,
                'email': trainee.email,
                'created_at': trainee.created_at.isoformat() if trainee.created_at else None,
                'completion_percentage': completion_percentage,
            })

        # Assignment status summary
        total_assignments = assignments.count()
        completed_assignments = assignments.filter(is_completed=True).count()
        in_progress_assignments = assignments.filter(is_completed=False, completed_at__ne=None).count()
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
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        assignments = ModuleAssignment.objects(trainee=user)
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
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        trainees = User.objects(role='trainee', is_active=True)
        serializer = UserSerializer(trainees, many=True)
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
    permission_classes = [permissions.AllowAny]  # JWT-based

    def post(self, request, module_id):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        trainee_ids = request.data.get('trainee_ids', [])
        if not isinstance(trainee_ids, list):
            return Response({'error': 'trainee_ids must be a list'}, status=400)
        if not trainee_ids:
            return Response({'error': 'No trainee IDs provided'}, status=400)
        module = TrainingModule.objects(id=module_id).first()
        if not module:
            return Response({'error': 'Module not found'}, status=404)
        assigned = []
        errors = []
        for trainee_id in trainee_ids:
            trainee = User.objects(id=trainee_id, role='trainee').first()
            if not trainee:
                errors.append(f'Trainee with ID {trainee_id} not found')
                continue
            assignment = ModuleAssignment.objects(trainee=trainee, module=module).first()
            if not assignment:
                assignment = ModuleAssignment(
                    trainee=trainee,
                    module=module,
                    assigned_by=user,
                    is_completed=False,
                    assigned_at=datetime.utcnow()
                )
                assignment.save()
            assigned.append(str(assignment.id))
        response_data = {
            'assigned': assigned,
            'total_requested': len(trainee_ids),
            'successfully_assigned': len(assigned)
        }
        if errors:
            response_data['errors'] = errors
        return Response(response_data, status=201)

class TraineeDeleteView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def delete(self, request, trainee_id):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)
        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)
        trainee = User.objects(id=trainee_id, role='trainee').first()
        if not trainee:
            return Response({'error': 'Trainee not found.'}, status=404)
        trainee.delete()
        return Response({'message': 'Trainee deleted successfully.'}, status=204)

class MessageInstructorView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def post(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        instructors = User.objects(role='instructor')
        if not instructors:
            return Response({'error': 'No instructor found.'}, status=status.HTTP_404_NOT_FOUND)
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required.'}, status=400)
        for instructor in instructors:
            msg = Message(
                sender=user,
                recipient=instructor,
                content=content
            )
            msg.save()
        return Response({'message': 'Message sent to all instructors.'}, status=status.HTTP_201_CREATED)

class InstructorMessagesView(APIView):
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user or user.role != 'instructor':
            return Response({'error': 'User not found or not instructor'}, status=403)

        messages = Message.objects(recipient=user).order_by('-timestamp')
        # Convert ObjectId to str in the response
        data = []
        for msg in messages:
            data.append({
                'id': str(msg.id),
                'sender': str(msg.sender.id),
                'recipient': str(msg.recipient.id),
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else None,
            })
        return Response(data)

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
    permission_classes = [permissions.AllowAny]  # JWT-based

    def get(self, request):
        # Extract JWT from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header missing'}, status=401)
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=401)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=401)

        user = User.objects(id=payload['user_id']).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        # Use MongoEngine's __raw__ for OR queries
        messages = Message.objects(__raw__={'$or': [{'sender': user.id}, {'recipient': user.id}]}).order_by('timestamp')
        data = []
        for msg in messages:
            data.append({
                'id': str(msg.id),
                'sender': {
                    'id': str(msg.sender.id),
                    'username': msg.sender.username,
                    'role': msg.sender.role,
                },
                'recipient': {
                    'id': str(msg.recipient.id),
                    'username': msg.recipient.username,
                    'role': msg.recipient.role,
                },
                'content': msg.content,
                'timestamp': msg.timestamp.isoformat() if msg.timestamp else None,
            })
        return Response(data)

class SuperAdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def get(self, request):
        trainee_count = User.objects.filter(role='trainee').count()
        instructor_count = User.objects.filter(role='instructor').count()
        return Response({
            'trainee_count': trainee_count,
            'instructor_count': instructor_count,
        })

class UserListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def get(self, request):
        users = User.objects.filter(role__in=['trainee', 'instructor'])
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class UserCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role__in=['trainee', 'instructor'])
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, role__in=['trainee', 'instructor'])
            user.delete()
            return Response({'message': 'User deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND) 
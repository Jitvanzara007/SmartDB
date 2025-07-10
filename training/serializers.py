from rest_framework import serializers
from passlib.hash import pbkdf2_sha256
from .models import User, TrainingModule, ModuleAssignment, Message
import datetime

class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    email = serializers.EmailField()
    role = serializers.CharField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField(required=False, allow_null=True)

    def to_representation(self, obj):
        return {
            'id': str(obj.id),
            'username': obj.username,
            'first_name': getattr(obj, 'first_name', '') or '',
            'last_name': getattr(obj, 'last_name', '') or '',
            'email': obj.email,
            'role': obj.role,
            'is_active': obj.is_active,
            'created_at': obj.created_at.isoformat() if getattr(obj, 'created_at', None) else datetime.datetime.utcnow().isoformat(),
        }

class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    role = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    def validate(self, data):
        if User.objects(username=data['username']).first():
            raise serializers.ValidationError('Username already exists')
        if User.objects(email=data['email']).first():
            raise serializers.ValidationError('Email already exists')
        return data

    def create(self, validated_data):
        hashed_password = pbkdf2_sha256.hash(validated_data['password'])
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            password=hashed_password,
            role=validated_data.get('role', 'trainee'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )
        user.save()
        return user

class UserUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    
    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        user = User.objects(username=username).first()
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not pbkdf2_sha256.verify(password, user.password):
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        attrs['user'] = user
        return attrs

class TrainingModuleSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    content = serializers.CharField(allow_blank=True, required=False)
    duration_minutes = serializers.IntegerField(required=False)
    is_active = serializers.BooleanField(required=False)
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    updated_at = serializers.DateTimeField(required=False, allow_null=True)
    # Add other fields as needed

    def to_representation(self, obj):
        return {
            'id': str(obj.id),
            'title': obj.title,
            'description': getattr(obj, 'description', '') or '',
            'content': getattr(obj, 'content', '') or '',
            'duration_minutes': getattr(obj, 'duration_minutes', 0) or 0,
            'is_active': getattr(obj, 'is_active', True),
            'created_at': obj.created_at.isoformat() if getattr(obj, 'created_at', None) else None,
            'updated_at': obj.updated_at.isoformat() if getattr(obj, 'updated_at', None) else None,
        }

class TrainingModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingModule
        fields = ['title', 'description', 'content', 'duration_minutes']

class ModuleAssignmentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    trainee = UserSerializer(read_only=True)
    module = TrainingModuleSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)
    is_completed = serializers.BooleanField()
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    assigned_at = serializers.DateTimeField(required=False, allow_null=True)

    def to_representation(self, obj):
        return {
            'id': str(obj.id),
            'trainee': UserSerializer(obj.trainee).data if obj.trainee else None,
            'module': TrainingModuleSerializer(obj.module).data if obj.module else None,
            'assigned_by': UserSerializer(obj.assigned_by).data if obj.assigned_by else None,
            'is_completed': obj.is_completed,
            'completed_at': obj.completed_at.isoformat() if getattr(obj, 'completed_at', None) else None,
            'assigned_at': obj.assigned_at.isoformat() if getattr(obj, 'assigned_at', None) else None,
        }

class ModuleAssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleAssignment
        fields = ['trainee_id', 'module_id']

class TraineeProgressSerializer(serializers.Serializer):
    total_assigned = serializers.IntegerField()
    completed = serializers.IntegerField()
    pending = serializers.IntegerField()
    completion_percentage = serializers.FloatField()

class TraineeDashboardSerializer(serializers.Serializer):
    user = UserSerializer()
    progress = TraineeProgressSerializer()
    assigned_modules = serializers.ListField()

class InstructorDashboardSerializer(serializers.Serializer):
    total_trainees = serializers.IntegerField()
    total_modules = serializers.IntegerField()
    trainees = UserSerializer(many=True)
    modules = TrainingModuleSerializer(many=True) 

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'recipient', 'timestamp'] 
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, TrainingModule, ModuleAssignment, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
    
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

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
        else:
            raise serializers.ValidationError('Must include username and password')

        attrs['user'] = user
        return attrs

class TrainingModuleSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TrainingModule
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class TrainingModuleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingModule
        fields = ['title', 'description', 'content', 'duration_minutes']

class ModuleAssignmentSerializer(serializers.ModelSerializer):
    trainee = UserSerializer(read_only=True)
    module = TrainingModuleSerializer(read_only=True)
    assigned_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ModuleAssignment
        fields = '__all__'
        read_only_fields = ['id', 'assigned_by', 'assigned_at']

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
    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'content', 'timestamp']
        read_only_fields = ['id', 'sender', 'recipient', 'timestamp'] 
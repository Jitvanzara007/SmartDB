import mongoengine as me
import datetime

class User(me.Document):
    username = me.StringField(required=True, unique=True)
    email = me.EmailField(required=True, unique=True)
    password = me.StringField(required=True)
    role = me.StringField(choices=("instructor", "trainee"), default="trainee")
    is_active = me.BooleanField(default=True)
    first_name = me.StringField()
    last_name = me.StringField()
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

class TrainingModule(me.Document):
    title = me.StringField(required=True, max_length=200)
    description = me.StringField()
    content = me.StringField()
    duration_minutes = me.IntField(default=0)
    created_by = me.ReferenceField(User, required=True)
    is_active = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

class ModuleAssignment(me.Document):
    trainee = me.ReferenceField(User, required=True)
    module = me.ReferenceField(TrainingModule, required=True)
    assigned_by = me.ReferenceField(User, required=True)
    is_completed = me.BooleanField(default=False)
    completed_at = me.DateTimeField()
    assigned_at = me.DateTimeField(default=datetime.datetime.utcnow)

class Message(me.Document):
    sender = me.ReferenceField(User, required=True)
    recipient = me.ReferenceField(User, required=True)
    content = me.StringField()
    timestamp = me.DateTimeField(default=datetime.datetime.utcnow) 
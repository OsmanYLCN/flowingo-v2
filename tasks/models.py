from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Task(models.Model):

    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=64, default='General')
    status = models.CharField(max_length=64, default='Pending')
    dueDate = models.DateField()
    dueTime = models.TimeField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
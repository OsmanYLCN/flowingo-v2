from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Task
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile

class TaskAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='tester', password='123')
        self.user2 = User.objects.create_user(username='hacker',password='123')

        response = self.client.post('/auth/login/', {'username': 'tester', 'password': '123'})
        self.token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION = 'Token ' + self.token)


    def test_create_task(self):
        data = {
            'title': 'test gorevi',
            'description': 'test aciklamasi',
            'category': 'Work',
            'status': 'To-Do',
            'dueDate': '2025-12-30',
            'dueTime': '14:00'
        }

        response = self.client.post('/api/tasks/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.get().title, 'test gorevi')

    def test_privacy_check(self):
        Task.objects.create(
            title = 'Gizli gorev',
            owner = self.user1,
            dueDate = '2025-12-30',
            dueTime = '10:00'
        )

        hacker_client = APIClient()
        res_login = hacker_client.post('/auth/login/', {'username': 'hacker', 'password': '123'})
        hacker_token = res_login.data['token']
        hacker_client.credentials(HTTP_AUTHORIZATION ='Token ' + hacker_token)

        response = hacker_client.get('/api/tasks/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_file_upload(self):
        task = Task.objects.create(
            title = 'Dosyali test gorevi',
            owner = self.user1,
            dueDate = '2025-12-30',
            dueTime = '10:00'
        )

        image = SimpleUploadedFile("test_image.jpg", b"file_content", content_type="image/jpeg")
        data = {
            'task': str(task.id),
            'file': image
        }

        response = self.client.post('/api/attachments/', data, format='multipart')

        if response.status_code != 201:
            print("\n🚨 HATA DETAYI:", response.data)
            print("🚨 Status Code:", response.status_code)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('file_url' in response.data)


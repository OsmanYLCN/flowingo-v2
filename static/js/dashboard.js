document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("flowingo_token");
    
    const taskListContainer = document.getElementById("task-list-container");
    const loadingMessage = document.getElementById("loading-tasks");
    const taskModalEl = document.getElementById("task-modal");
    const taskModal = new bootstrap.Modal(taskModalEl);
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskForm = document.getElementById("task-form");
    const modalTitle = document.getElementById("modal-title");
    const deleteModalEl = document.getElementById("delete-confirm-modal");
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    if (!token) {
        window.location.href = "/auth/";
        return;
    }
    
    async function fetchTasks() {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/tasks/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem("flowingo_token");
                window.location.href = "/auth/";
                return;
            }

            const tasks = await response.json();
            loadingMessage.style.display = "none";
            taskListContainer.innerHTML = ""; 

            if (tasks.length === 0) {
                taskListContainer.innerHTML = "<p>You have no tasks yet. Click 'Add New Task' to start!</p>";
            } else {
                tasks.forEach(task => {
                    const taskCard = createTaskCard(task);
                    taskListContainer.appendChild(taskCard);
                });
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
            loadingMessage.textContent = "Error loading tasks. Please refresh.";
        }
    }

    function createTaskCard(task) {
        const cardCol = document.createElement("div");
        cardCol.className = "col-md-4 mb-4"; 
        let statusColor = "bg-warning"; 
        if (task.status === "In Progress") statusColor = "bg-info";
        else if (task.status === "Done") statusColor = "bg-success";
        
        cardCol.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${task.title}</h5>
                    <p class="card-text flex-grow-1">${task.description || ""}</p>
                    <div>
                        <span class="badge bg-secondary">${task.category}</span>
                        <span class="badge ${statusColor}">${task.status}</span>
                    </div>
                    <small class="text-muted mt-2">
                        Due: ${task.dueDate} at ${task.dueTime}
                    </small>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-outline-dark edit-btn" data-task-id="${task.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-task-id="${task.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
        return cardCol;
    }
    
    addTaskBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Task";
        taskForm.reset();
        document.getElementById("task-id").value = ""; 
        taskModal.show();
    });

    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const taskData = {
            title: document.getElementById("task-title").value,
            description: document.getElementById("task-description").value,
            category: document.getElementById("task-category").value,
            status: document.getElementById("task-status").value,
            dueDate: document.getElementById("task-dueDate").value,
            dueTime: document.getElementById("task-dueTime").value
        };
        
        const taskId = document.getElementById("task-id").value;
        let method = "POST";
        let url = "http://127.0.0.1:8000/api/tasks/";

        if (taskId) {
            method = "PUT";
            url = `http://127.0.0.1:8000/api/tasks/${taskId}/`;
        }
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(taskData)
            });

            if (response.status === 201 || response.status === 200) {
                taskModal.hide();
                fetchTasks();
            } else {
                const errorData = await response.json();
                console.error("Error saving task:", errorData);
                alert("Error saving task. Check console for details.");
            }
        } catch (error) {
            console.error("Network error:", error);
            alert("Could not connect to server to save task.");
        }
    });

    taskListContainer.addEventListener("click", async (e) => {
        const target = e.target;
        const taskId = target.dataset.taskId; 

        if (target.classList.contains("delete-btn")) {
            
            confirmDeleteBtn.dataset.taskId = taskId;
            
            deleteModal.show();
        }

        if (target.classList.contains("edit-btn")) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
                    method: "GET",
                    headers: { "Authorization": `Token ${token}` }
                });
                
                if (response.status === 200) {
                    const task = await response.json();
                    
                    
                    modalTitle.textContent = "Edit Task";
                    document.getElementById("task-id").value = task.id;
                    document.getElementById("task-title").value = task.title;
                    document.getElementById("task-description").value = task.description;
                    document.getElementById("task-category").value = task.category;
                    document.getElementById("task-status").value = task.status;
                    document.getElementById("task-dueDate").value = task.dueDate;
                    document.getElementById("task-dueTime").value = task.dueTime;
                    
                    
                    taskModal.show();
                } else {
                    alert("Failed to fetch task details for editing.");
                }
            } catch (error) {
                console.error("Edit error:", error);
                alert("Could not connect to server to edit task.");
            }
        }
    });

    confirmDeleteBtn.addEventListener("click", async () => {
        const taskId = confirmDeleteBtn.dataset.taskId;
        
        if (taskId) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
                    method: "DELETE",
                    headers: { "Authorization": `Token ${token}` }
                });
                
                if (response.status === 204) { 
                    fetchTasks(); 
                } else {
                    alert("Failed to delete task.");
                }
            } catch (error) {
                console.error("Delete error:", error);
                alert("Could not connect to server to delete task.");
            }
            
            deleteModal.hide();
            confirmDeleteBtn.dataset.taskId = ""; 
        }
    });

    fetchTasks();
});
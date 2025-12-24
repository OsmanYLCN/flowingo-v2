document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("flowingo_token");
    
    // --- HTML ELEMENTLERİ ---
    const taskListContainer = document.getElementById("task-list-container");
    const loadingMessage = document.getElementById("loading-tasks");
    
    // Filtreler
    const filterSearch = document.getElementById("filter-search");
    const filterCategory = document.getElementById("filter-category");
    const filterStatus = document.getElementById("filter-status");

    // Task Modalı
    const taskModalEl = document.getElementById("task-modal");
    const taskModal = new bootstrap.Modal(taskModalEl);
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskForm = document.getElementById("task-form");
    const modalTitle = document.getElementById("modal-title");
    
    // Silme Modalı
    const deleteModalEl = document.getElementById("delete-confirm-modal");
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    // Admin Elementleri (Görev Atama Kutusu)
    const assignUserContainer = document.getElementById("assignUserContainer");
    const taskOwnerSelect = document.getElementById("taskOwnerSelect");

    // Global Değişkenler
    let allTasks = [];
    let isUserAdmin = false;

    // Token Yoksa Girişe At
    if (!token) {
        window.location.href = "/auth/";
        return;
    }
    
    // ---------------------------------------------------------
    // 1. ADMIN KONTROLÜ (Sayfa Açılınca)
    // ---------------------------------------------------------
    async function checkAdminAndLoadUsers() {
        try {
            const response = await fetch("http://127.0.0.1:8000/api/users/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            });

            if (response.ok) {
                isUserAdmin = true; 
                const users = await response.json();
                
                // Admin kutusunu görünür yap
                if(assignUserContainer) assignUserContainer.style.display = "block";
                
                // Dropdown'ı doldur
                if(taskOwnerSelect) {
                    taskOwnerSelect.innerHTML = '<option value="">Assign to Myself (Default)</option>';
                    users.forEach(user => {
                        const option = document.createElement("option");
                        option.value = user.id;
                        option.textContent = `User: ${user.username}`;
                        taskOwnerSelect.appendChild(option);
                    });
                }
            } 
        } catch (error) {
            console.log("Not an admin or error checking admin status.");
            isUserAdmin = false;
        }
        
        // Admin kontrolü bitse de bitmese de görevleri çek
        fetchTasks();
    }

    // ---------------------------------------------------------
    // 2. GÖREVLERİ ÇEKME
    // ---------------------------------------------------------
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

            allTasks = await response.json();
            
            // Loading yazısını kaldır
            if(loadingMessage) loadingMessage.style.display = "none";
            
            // Listeyi Ekrana Bas
            filterTasks();

        } catch (error) {
            console.error("Error fetching tasks:", error);
            if(loadingMessage) loadingMessage.textContent = "Error loading tasks.";
        }
    }

    // ---------------------------------------------------------
    // 3. FİLTRELEME
    // ---------------------------------------------------------
    function filterTasks() {
        const searchTerm = filterSearch.value.toLowerCase();
        const selectedCategory = filterCategory.value;
        const selectedStatus = filterStatus.value;

        const filtered = allTasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === "" || task.category === selectedCategory;
            const matchesStatus = selectedStatus === "" || task.status === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        renderTasks(filtered);
    }

    filterSearch.addEventListener("input", filterTasks);
    filterCategory.addEventListener("change", filterTasks);
    filterStatus.addEventListener("change", filterTasks);

    // ---------------------------------------------------------
    // 4. EKRANA BASMA (RENDER)
    // ---------------------------------------------------------
    function renderTasks(tasks) {
        taskListContainer.innerHTML = ""; 

        if (tasks.length === 0) {
            taskListContainer.innerHTML = "<div class='col-12'><p class='text-muted text-center'>No tasks found.</p></div>";
            return;
        }

        tasks.forEach(task => {
            const taskCard = createTaskCard(task);
            taskListContainer.appendChild(taskCard);
        });
    }

    function createTaskCard(task) {
        const cardCol = document.createElement("div");
        cardCol.className = "col-md-4 mb-4"; 
        
        // Görsel Stil
        let badgeColor = "bg-secondary";
        let cardStyleClass = "shadow-sm"; 
        let titleStyle = "";
        let completedBg = "";

        if (task.status === "To-Do") badgeColor = "bg-warning text-dark";
        else if (task.status === "In Progress") badgeColor = "bg-info text-dark";
        else if (task.status === "Completed") {
            badgeColor = "bg-success";
            cardStyleClass += " border-success"; 
            titleStyle = "text-decoration-line-through text-muted";
            completedBg = "background-color: #f8fff9;"; 
        }

        // Tarih Hesaplama
        const now = new Date();
        let cleanTime = task.dueTime;
        if(cleanTime && cleanTime.length > 5) cleanTime = cleanTime.substring(0, 5);
        
        let borderClass = "border-0"; 
        let alertHtml = "";
        
        if (task.status !== "Completed") {
            const dueDateTime = new Date(`${task.dueDate}T${cleanTime}`);
            const diffMs = dueDateTime - now;
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffMs < 0) {
                borderClass = "border border-danger border-3"; 
                alertHtml = `<div class="text-danger fw-bold mt-1"><i class="bi bi-exclamation-octagon"></i> Overdue!</div>`;
            } else if (diffHours < 24) {
                borderClass = "border border-warning border-3"; 
                alertHtml = `<div class="text-warning fw-bold mt-1"><i class="bi bi-hourglass-split"></i> Due Soon!</div>`;
            }
        }

        // Dosya Listesi
        let attachmentsHtml = "";
        if (task.attachments && task.attachments.length > 0) {
            attachmentsHtml = `<div class="mt-2 pt-2 border-top small">
                <strong>Attachments:</strong>
                <ul class="list-unstyled mb-0">`;
            task.attachments.forEach(file => {
                if (file.file_url) {
                    attachmentsHtml += `<li>
                        <a href="${file.file_url}" target="_blank" class="text-decoration-none text-primary">
                            <i class="bi bi-paperclip"></i> ${file.file_name}
                        </a>
                    </li>`;
                }
            });
            attachmentsHtml += `</ul></div>`;
        }

        // Sahip Bilgisi (Sadece Admin görür)
        let ownerHtml = "";
        if (isUserAdmin && task.owner) {
            ownerHtml = `<div class="card-footer text-muted small py-1 bg-light">
                            <i class="bi bi-person"></i> Owner: <strong>${task.owner}</strong>
                         </div>`;
        }

        cardCol.innerHTML = `
            <div class="card h-100 ${cardStyleClass} ${borderClass}" style="${completedBg}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title ${titleStyle}">
                            ${task.title}
                        </h5>
                        <span class="badge ${badgeColor}">${task.status}</span>
                    </div>
                    
                    <p class="card-text flex-grow-1 mt-2 ${task.status === 'Completed' ? 'text-muted' : ''}">${task.description || ""}</p>
                    
                    <div><span class="badge bg-secondary opacity-75">${task.category}</span></div>

                    <div class="mt-2 text-muted small">
                         <i class="bi bi-calendar-event"></i> Due: ${task.dueDate} at ${cleanTime}
                         ${alertHtml}
                    </div>

                    ${attachmentsHtml}

                    <div class="mt-3 pt-2 border-top">
                        <button class="btn btn-sm btn-outline-dark edit-btn" data-task-id="${task.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-task-id="${task.id}">Delete</button>
                    </div>
                </div>
                ${ownerHtml}
            </div>
        `;
        return cardCol;
    }
    
    // ---------------------------------------------------------
    // 5. GÖREV EKLEME / EDİTLEME MODAL AÇILIŞI
    // ---------------------------------------------------------
    addTaskBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Task";
        taskForm.reset();
        document.getElementById("task-id").value = ""; 
        
        if(taskOwnerSelect) taskOwnerSelect.value = ""; 
        
        const now = new Date();
        document.getElementById("task-dueDate").value = now.toISOString().split('T')[0];
        document.getElementById("task-dueTime").value = now.toTimeString().slice(0,5);
        
        const fileInput = document.getElementById("task-file");
        if(fileInput) fileInput.value = ""; 
        
        taskModal.show();
    });

    // ---------------------------------------------------------
    // 6. FORM GÖNDERME (KAYDETME)
    // ---------------------------------------------------------
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const title = document.getElementById("task-title").value;
        const description = document.getElementById("task-description").value;
        const category = document.getElementById("task-category").value;
        const status = document.getElementById("task-status").value;
        const dueDate = document.getElementById("task-dueDate").value;
        const dueTime = document.getElementById("task-dueTime").value;
        const taskId = document.getElementById("task-id").value;
        const assignedUserId = taskOwnerSelect ? taskOwnerSelect.value : null;

        const fileInput = document.getElementById("task-file");
        const selectedFile = fileInput ? fileInput.files[0] : null;

        let method = "POST";
        let url = "http://127.0.0.1:8000/api/tasks/";

        if (taskId) {
            method = "PUT";
            url = `http://127.0.0.1:8000/api/tasks/${taskId}/`;
        }
        
        try {
            const payload = { title, description, category, status, dueDate, dueTime };
            if (assignedUserId) { payload.owner_id = assignedUserId; }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const savedTask = await response.json();
                const targetTaskId = taskId ? taskId : savedTask.id;

                if (selectedFile) {
                    const formData = new FormData();
                    formData.append("task", targetTaskId);
                    formData.append("file", selectedFile);
                    
                    await fetch("http://127.0.0.1:8000/api/attachments/", {
                        method: "POST",
                        headers: { "Authorization": `Token ${token}` },
                        body: formData
                    });
                }
                taskModal.hide();
                fetchTasks();
            } else {
                alert("Error saving task.");
            }
        } catch (error) { console.error(error); }
    });

    // ---------------------------------------------------------
    // 7. BUTON DİNLEYİCİLERİ (Edit / Delete)
    // ---------------------------------------------------------
    taskListContainer.addEventListener("click", async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const taskId = target.dataset.taskId; 

        if (target.classList.contains("delete-btn")) {
            confirmDeleteBtn.dataset.taskId = taskId;
            deleteModal.show();
        }

        if (target.classList.contains("edit-btn")) {
            const task = allTasks.find(t => t.id == taskId);
            if (task) {
                modalTitle.textContent = "Edit Task";
                document.getElementById("task-id").value = task.id;
                document.getElementById("task-title").value = task.title;
                document.getElementById("task-description").value = task.description;
                document.getElementById("task-category").value = task.category;
                document.getElementById("task-status").value = task.status;
                document.getElementById("task-dueDate").value = task.dueDate;
                
                let cleanTime = task.dueTime;
                if(cleanTime.length > 5) cleanTime = cleanTime.substring(0, 5);
                document.getElementById("task-dueTime").value = cleanTime;
                
                const fileInput = document.getElementById("task-file");
                if(fileInput) fileInput.value = "";
                if(taskOwnerSelect) taskOwnerSelect.value = "";
                
                taskModal.show();
            }
        }
    });

    // Silme Onayı
    confirmDeleteBtn.addEventListener("click", async () => {
        const taskId = confirmDeleteBtn.dataset.taskId;
        if (taskId) {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}/`, {
                    method: "DELETE",
                    headers: { "Authorization": `Token ${token}` }
                });
                if (response.status === 204) { 
                    deleteModal.hide();
                    fetchTasks(); 
                }
            } catch (error) { console.error(error); }
        }
    });

    // ---------------------------------------------------------
    // 8. BAŞLAT
    // ---------------------------------------------------------
    checkAdminAndLoadUsers(); 
});
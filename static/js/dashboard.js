document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("flowingo_token");
    
    // HTML Elementleri
    const taskListContainer = document.getElementById("task-list-container");
    const loadingMessage = document.getElementById("loading-tasks");
    
    // Filtre Elementleri
    const filterSearch = document.getElementById("filter-search");
    const filterCategory = document.getElementById("filter-category");
    const filterStatus = document.getElementById("filter-status");

    // Modal ve Form Elementleri
    const taskModalEl = document.getElementById("task-modal");
    const taskModal = new bootstrap.Modal(taskModalEl);
    const addTaskBtn = document.getElementById("add-task-btn");
    const taskForm = document.getElementById("task-form");
    const modalTitle = document.getElementById("modal-title");
    const deleteModalEl = document.getElementById("delete-confirm-modal");
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    // Tüm görevleri tutacağımız global değişken
    let allTasks = [];

    if (!token) {
        window.location.href = "/auth/";
        return;
    }
    
    // --- 1. GÖREVLERİ ÇEK ---
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
            loadingMessage.style.display = "none";
            
            // Veriyi çeker çekmez filtre fonksiyonunu çağırıyoruz
            filterTasks();

        } catch (error) {
            console.error("Error fetching tasks:", error);
            loadingMessage.textContent = "Error loading tasks. Please refresh.";
        }
    }

    // --- 2. FİLTRELEME MANTIĞI ---
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

    // Filtreler değişince tetikle
    filterSearch.addEventListener("input", filterTasks);
    filterCategory.addEventListener("change", filterTasks);
    filterStatus.addEventListener("change", filterTasks);

    // --- 3. EKRANA BASMA VE RENKLENDİRME ---
    function renderTasks(tasks) {
        taskListContainer.innerHTML = ""; 

        if (tasks.length === 0) {
            taskListContainer.innerHTML = "<div class='col-12'><p class='text-muted text-center'>No tasks found matching your criteria.</p></div>";
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
        
        // Statü Rengi
        let badgeColor = "bg-secondary";
        if (task.status === "To-Do") badgeColor = "bg-warning text-dark";
        else if (task.status === "In Progress") badgeColor = "bg-info text-dark";
        else if (task.status === "Completed") badgeColor = "bg-success";

        // --- TARİH HESAPLAMA ---
        const now = new Date();
        let cleanTime = task.dueTime;
        if(cleanTime && cleanTime.length > 5) cleanTime = cleanTime.substring(0, 5);
        const dueDateTime = new Date(`${task.dueDate}T${cleanTime}`);
        const diffMs = dueDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        let borderClass = "border-0"; 
        let alertHtml = "";

        if (task.status !== "Completed") {
            if (diffMs < 0) {
                borderClass = "border border-danger border-3"; 
                alertHtml = `<div class="text-danger fw-bold mt-1"><i class="bi bi-exclamation-octagon"></i> Overdue!</div>`;
            } else if (diffHours < 24) {
                borderClass = "border border-warning border-3"; 
                alertHtml = `<div class="text-warning fw-bold mt-1"><i class="bi bi-hourglass-split"></i> Due Soon!</div>`;
            }
        }

        // --- DOSYALARI LİSTELEME ---
        let attachmentsHtml = "";
        if (task.attachments && task.attachments.length > 0) {
            attachmentsHtml = `<div class="mt-2 pt-2 border-top small">
                <strong>Attachments:</strong>
                <ul class="list-unstyled mb-0">`;
            
            task.attachments.forEach(file => {
                // Dosya linki varsa göster
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

        cardCol.innerHTML = `
            <div class="card h-100 shadow-sm ${borderClass}">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start">
                        <h5 class="card-title">${task.title}</h5>
                        <span class="badge ${badgeColor}">${task.status}</span>
                    </div>
                    
                    <p class="card-text flex-grow-1 mt-2">${task.description || ""}</p>
                    
                    <div>
                        <span class="badge bg-secondary opacity-75">${task.category}</span>
                    </div>

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
            </div>
        `;
        return cardCol;
    }
    
    // --- GÖREV EKLEME BUTONU ---
    addTaskBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Task";
        taskForm.reset();
        document.getElementById("task-id").value = ""; 
        
        // Tarihleri bugüne ayarla
        const now = new Date();
        document.getElementById("task-dueDate").value = now.toISOString().split('T')[0];
        document.getElementById("task-dueTime").value = now.toTimeString().slice(0,5);
        
        // Dosya inputunu temizle (Önemli!)
        const fileInput = document.getElementById("task-file");
        if(fileInput) fileInput.value = ""; 
        
        taskModal.show();
    });

    // --- FORM SUBMIT (KAYDETME VE DOSYA YÜKLEME) ---
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const title = document.getElementById("task-title").value;
        const description = document.getElementById("task-description").value;
        const category = document.getElementById("task-category").value;
        const status = document.getElementById("task-status").value;
        const dueDate = document.getElementById("task-dueDate").value;
        const dueTime = document.getElementById("task-dueTime").value;
        
        const taskId = document.getElementById("task-id").value;
        
        // Dosya kontrolü
        const fileInput = document.getElementById("task-file");
        const selectedFile = fileInput ? fileInput.files[0] : null;

        let method = "POST";
        let url = "http://127.0.0.1:8000/api/tasks/";

        if (taskId) {
            method = "PUT";
            url = `http://127.0.0.1:8000/api/tasks/${taskId}/`;
        }
        
        try {
            // 1. Önce GÖREVİ kaydet
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify({ title, description, category, status, dueDate, dueTime })
            });

            if (response.ok) {
                // Görev yanıtını al (ID lazım)
                const savedTask = await response.json();
                const targetTaskId = taskId ? taskId : savedTask.id;

                // 2. Eğer dosya seçildiyse DOSYAYI yükle
                if (selectedFile) {
                    const formData = new FormData();
                    formData.append("task", targetTaskId);
                    formData.append("file", selectedFile);

                    console.log("Uploading file...", selectedFile.name);

                    const fileResponse = await fetch("http://127.0.0.1:8000/api/attachments/", {
                        method: "POST",
                        headers: {
                            // FormData'da Content-Type ELLE YAZILMAZ!
                            "Authorization": `Token ${token}`
                        },
                        body: formData
                    });
                    
                    if (!fileResponse.ok) {
                        console.error("File upload failed!");
                        alert("Task saved but file upload failed.");
                    }
                }

                // Her şey bitti, kapat ve yenile
                taskModal.hide();
                fetchTasks();

            } else {
                alert("Error saving task.");
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    });

    // --- SİLME VE DÜZENLEME BUTONLARI ---
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
                
                // Edit modunda dosya inputunu temizle (yeni dosya yüklemek isterse seçsin)
                const fileInput = document.getElementById("task-file");
                if(fileInput) fileInput.value = "";

                taskModal.show();
            }
        }
    });

    // --- SİLME ONAYI ---
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

    fetchTasks();
});
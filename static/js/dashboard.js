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

    // --- 2. FİLTRELEME MANTIĞI (SORUN BURADAYDI, DÜZELTİLDİ) ---
    function filterTasks() {
        const searchTerm = filterSearch.value.toLowerCase();
        const selectedCategory = filterCategory.value;
        const selectedStatus = filterStatus.value;

        // Konsola yazdıralım ki çalıştığını gör
        console.log("Filtreleniyor...", {searchTerm, selectedCategory, selectedStatus});

        const filtered = allTasks.filter(task => {
            // Arama filtresi
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            
            // Kategori filtresi (Boşsa hepsini getir, doluysa eşleşeni getir)
            const matchesCategory = selectedCategory === "" || task.category === selectedCategory;
            
            // Statü filtresi
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

        // --- TARİH HESAPLAMA (JS TARAFINDA) ---
        // Backend'den ne gelirse gelsin, hesabı burada yapıyoruz.
        const now = new Date();
        
        // Saat formatını temizle (18:03:00 -> 18:03)
        let cleanTime = task.dueTime;
        if(cleanTime && cleanTime.length > 5) cleanTime = cleanTime.substring(0, 5);
        
        // Tarihi birleştir: "2025-11-25T18:03"
        const dueDateTime = new Date(`${task.dueDate}T${cleanTime}`);
        
        // Farkı bul (milisaniye)
        const diffMs = dueDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        let borderClass = "border-0"; 
        let alertHtml = "";

        // Sadece tamamlanmamış görevler için uyarı ver
        if (task.status !== "Completed") {
            if (diffMs < 0) {
                // SÜRE BİTMİŞ -> KIRMIZI
                borderClass = "border border-danger border-3"; 
                alertHtml = `<div class="text-danger fw-bold mt-1"><i class="bi bi-exclamation-octagon"></i> Overdue!</div>`;
            } else if (diffHours < 24) {
                // 24 SAATTEN AZ -> TURUNCU
                borderClass = "border border-warning border-3"; 
                alertHtml = `<div class="text-warning fw-bold mt-1"><i class="bi bi-hourglass-split"></i> Due Soon!</div>`;
            }
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

                    <div class="mt-3 pt-2 border-top">
                        <button class="btn btn-sm btn-outline-dark edit-btn" data-task-id="${task.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-task-id="${task.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
        return cardCol;
    }
    
    // --- STANDART BUTTON EVENTS (DEĞİŞMEDİ) ---

    addTaskBtn.addEventListener("click", () => {
        modalTitle.textContent = "Add New Task";
        taskForm.reset();
        document.getElementById("task-id").value = ""; 
        const now = new Date();
        document.getElementById("task-dueDate").value = now.toISOString().split('T')[0];
        document.getElementById("task-dueTime").value = now.toTimeString().slice(0,5);
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
                alert("Error saving task.");
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    });

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
                taskModal.show();
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
                    deleteModal.hide();
                    fetchTasks(); 
                }
            } catch (error) { console.error(error); }
        }
    });

    fetchTasks();
});
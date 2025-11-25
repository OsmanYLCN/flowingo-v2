document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("flowingo_token");

    // HTML Elementleri (Yeni Eklenen Kutucuklar)
    const elTotal = document.getElementById("stat-total");
    const elCompleted = document.getElementById("stat-completed");
    const elPending = document.getElementById("stat-pending");
    const elRate = document.getElementById("stat-rate");

    if (!token) {
        window.location.href = "/auth/";
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/api/tasks/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`,
            }
        });

        if (!response.ok) throw new Error(`API Hatası: ${response.status}`);

        const tasks = await response.json();
        
        // --- 1. ÖZET KARTLARINI DOLDUR ---
        const totalTasks = tasks.length;
        // Tamamlananları say (Modelde 'Completed' demiştik)
        const completedTasks = tasks.filter(t => t.status === "Completed").length;
        // Bekleyenler (Toplam - Tamamlanan)
        const pendingTasks = totalTasks - completedTasks;
        // Başarı Oranı (Sıfıra bölme hatası olmasın diye kontrol et)
        const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Sayıları Ekrana Yaz
        if(elTotal) elTotal.innerText = totalTasks;
        if(elCompleted) elCompleted.innerText = completedTasks;
        if(elPending) elPending.innerText = pendingTasks;
        if(elRate) elRate.innerText = `%${successRate}`;

        // --- 2. GRAFİK VERİLERİNİ HAZIRLA ---
        let statusCounts = { "To-Do": 0, "In Progress": 0, "Completed": 0};
        let categoryCounts = {};

        tasks.forEach(task => {
            // Status Sayımı
            if (statusCounts[task.status] !== undefined){
                statusCounts[task.status]++;
            } else {
                statusCounts[task.status] = 1;
            }

            // Kategori Sayımı
            if (categoryCounts[task.category]) {
                categoryCounts[task.category]++;
            } else {
                categoryCounts[task.category] = 1;
            }
        });
        
        renderStatusChart(statusCounts);
        renderCategoryChart(categoryCounts);
        
    } catch (error) {
        console.error("Error loading statistics: ", error);
    }
});

function renderStatusChart(data){
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), { 
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#ffc107', // To-Do
                    '#0dcaf0', // In Progress
                    '#198754'  // Completed
                ],
                hoverOffset: 4,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            cutout: '70%' // Ortası daha boş olsun, modern görünüm
        }
    });
}

function renderCategoryChart(data){
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Tasks',
                data: Object.values(data),
                backgroundColor: '#212529',
                borderRadius: 5,
                barThickness: 40 // Çubuklar çok kalın olmasın
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { display: true, drawBorder: false } // Çizgileri yumuşat
                },
                x: {
                    grid: { display: false } // Dikey çizgileri kaldır
                }
            }
        }
    });
}
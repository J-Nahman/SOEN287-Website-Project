document.addEventListener('DOMContentLoaded', function () {
    // Calendar functionality
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const slotsContainer = document.querySelector('.slots-container');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');
    const bookButton = document.getElementById('book-button');

    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;

    // Generates calendar for the current month
    function generateCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Clear previous calendar
        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }

        // Update calendar header
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        document.querySelector('.calendar-header h2').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-date other-month';
            calendarGrid.appendChild(emptyCell);
        }

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-date';
            dateCell.textContent = i;

            // Check if this date is today
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dateCell.style.border = '2px solid #912338';
            }

            // Add click event
            dateCell.addEventListener('click', function () {
                // Remove selected class from all dates
                document.querySelectorAll('.calendar-date').forEach(cell => {
                    cell.classList.remove('selected');
                });

                // Add selected class to clicked date
                dateCell.classList.add('selected');

                // Update selected date
                selectedDate = new Date(year, month, i);
                summaryDate.textContent = selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Generate time slots for selected date
                generateTimeSlots();

                // Reset selected time
                selectedTime = null;
                summaryTime.textContent = 'Not selected';
            });

            calendarGrid.appendChild(dateCell);
        }
    }

    // Generate time slots
    function generateTimeSlots() {
        // Clear previous time slots
        slotsContainer.innerHTML = '';

        // Generate time slots from 9 AM to 5 PM
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = document.createElement('div');
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Randomly mark some slots as booked for demonstration
                const isBooked = Math.random() < 0.2;

                timeSlot.className = isBooked ? 'time-slot booked' : 'time-slot';
                timeSlot.textContent = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

                if (!isBooked) {
                    timeSlot.addEventListener('click', function () {
                        // Remove selected class from all time slots
                        document.querySelectorAll('.time-slot').forEach(slot => {
                            slot.classList.remove('selected');
                        });

                        // Add selected class to clicked time slot
                        timeSlot.classList.add('selected');

                        // Update selected time
                        selectedTime = timeString;
                        summaryTime.textContent = timeSlot.textContent;
                    });
                }

                slotsContainer.appendChild(timeSlot);
            }
        }
    }

    // Event listeners for month navigation
    prevMonthBtn.addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate);
    });

    nextMonthBtn.addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
    });

    // Book button event listener
    bookButton.addEventListener('click', function () {
        if (!selectedDate || !selectedTime) {
            alert('Please select both a date and time for your booking.');
            return;
        }
        //this alert will be sent to backend when backend is implemented
        alert(`Booking confirmed for ${summaryDate.textContent} at ${summaryTime.textContent}`);
    });

    // Initialize calendar and time slots
    generateCalendar(currentDate);
    generateTimeSlots();
});
document.addEventListener('DOMContentLoaded', function () {
  const API_BASE_URL = 'http://localhost:3000/api';
    // Calendar functionality
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const slotsContainer = document.querySelector('.slots-container');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');
    const bookButton = document.getElementById('book-button');

    let currentDate = new Date();
    let selectedDate = new Date().toISOString().split('T')[0];
    let selectedTime = null;
    let currentUserId = 1;

    const urlParams = new URLSearchParams(window.location.search);
    let currentResourceId = parseInt(urlParams.get('resourceId')) || 1;
    
    console.log('🔗 Resource ID from URL:', currentResourceId);


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
                
                const formattedDate = selectedDate.toISOString().split('T')[0]; // creates dateString
                console.log('📅 Date selected - formatted:', formattedDate);

                summaryDate.textContent = selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Generate time slots for selected date
                generateTimeSlots(formattedDate);

                // Reset selected time
                selectedTime = null;
                summaryTime.textContent = 'Not selected';
            });

            calendarGrid.appendChild(dateCell);
        }
    }

    // Generate time slots
    async function generateTimeSlots(dateString) {
        // Clear previous time slots
        slotsContainer.innerHTML = '<div class="loading">Loading available slots...</div>';

        try {
            const response = await fetch(
                `${API_BASE_URL}/available-slots?date=${dateString}&resourceId=${currentResourceId}`
            );

            if (!response.ok) throw new Error('failed to fetch available slots');

            const data = await response.json();
            const bookedTimeSlots = data.bookedTimeSlots;
            slotsContainer.innerHTML = '';

            // Generate time slots from 9 AM to 5 PM
            for (let hour = 9; hour <= 17; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const timeSlot = document.createElement('div');
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

                    // Read booked slots taken from database
                    const isBooked = bookedTimeSlots.includes(timeString);

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

            if (slotsContainer.children.length === 0) {
                slotsContainer.innerHTML = '<div class="no-slots">No available time slots for this date</div>';
            }
        } catch(error) {
            console.error('Error generating time slots:', error);
            slotsContainer.innerHTML = '<div class="error">Error loading time slots. Please try again.</div>';
        }
    }

    async function bookSlot() {
        if (!selectedDate || !selectedTime) {
            alert('Please select both a date and time for your booking.');
            return;
        }
        
        const bookingData = {
            userId: currentUserId,
            resourceId: currentResourceId,
            date: selectedDate.toISOString().split('T')[0],
            time_slot: selectedTime
        };

        console.log('sending booking data: ', bookingData);
        try {
            bookButton.disabled = true;
            bookButton.textContent = 'Booking...';

            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify(bookingData)
            });
            
            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Failed to create booking');

            alert(`✅ Booking confirmed for ${summaryDate.textContent} at ${summaryTime.textContent}`);

            const formattedDate = selectedDate.toISOString().split('T')[0];
            generateTimeSlots(formattedDate);
            
        } catch (error) {
            console.error('Booking error:', error);
            alert(`❌ Booking failed: ${error.message}`);

        } finally {
            bookButton.disabled = false;
            bookButton.textContent = 'Book Now';
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
        bookSlot();
    });

    // Initialize calendar and time slots
    generateCalendar(currentDate);
    generateTimeSlots(selectedDate);
});
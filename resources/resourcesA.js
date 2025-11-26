document.addEventListener('DOMContentLoaded', function () {
    // Calendar functionality
    const calendarGrid = document.querySelector('.calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const slotsContainer = document.querySelector('.slots-container');
    const bookingsList = document.getElementById('bookings-list');
    const blockSlotBtn = document.getElementById('block-slot');
    const unblockSlotBtn = document.getElementById('unblock-slot');
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const refreshBtn = document.getElementById('refresh-btn');

    let currentDate = new Date();
    let selectedDate = new Date();
    let selectedTimeSlot = null;
    let currentUserId = 1;

    const urlParams = new URLSearchParams(window.location.search);
    let currentResourceId = parseInt(urlParams.get('resourceId')) || 1;
    
    console.log('Resource ID from URL:', currentResourceId);

    const API_BASE_URL = 'http://localhost:3000/api';

    // Initialize by fetching current bookings
    let bookingsData = {};

    initializeAdmin();

    async function initializeAdmin() {
        try {
            await fetchAllBookings();
            generateCalendar(currentDate);
            updateButtonStates();
        } catch (error) {
            console.error('Error initializing admin:', error);
            alert('Failed to load booking data');
        }
    }

    // Fetch data from server api
    async function fetchAllBookings() {
        try {
            console.log('Fetching all bookingsData...');
            const response = await fetch(`${API_BASE_URL}/bookings`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const bookings = await response.json();
            console.log('Bookings fetched:', bookings);

            //FILTER ALL BOOKINGS BY RESOURCE ID

            const filteredBookings = bookings.filter(booking =>
                booking.resource_id === currentResourceId
            );

            //Take fetched data and convert it for frontend
            const reformatedBookings = {};

            filteredBookings.forEach(filteredBookings => {
                const date = filteredBookings.date.split('T')[0];
                const time = filteredBookings.time_slot;
                if (!reformatedBookings[date]) {
                    reformatedBookings[date] = {};
                }

                // Check if this is an admin block (user_id = 99999)
                const isBlock = filteredBookings.user_id === 99999;

                reformatedBookings[date][time] = {
                    user: isBlock ? 'Admin (Blocked)' : `User ${filteredBookings.user_id}`,
                    type: isBlock ? "blocked" : "booked",
                    bookingId: filteredBookings.id,
                    resourceId: filteredBookings.resource_id
                };
            });

            bookingsData = reformatedBookings;
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    }

    // Generate calendar for the current month
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

            // Check if this date has bookings or blocks
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            const dateData = bookingsData[dateString];

            // Add indicator if date has bookings or blocks
            if (dateData) {
                const hasBookings = Object.values(dateData).some(slot => slot.type === "booking");
                const hasBlocks = Object.values(dateData).some(slot => slot.type === "blocked");

                if (hasBookings && hasBlocks) {
                    dateCell.style.border = "2px solid #ff9900"; // Orange for mixed
                } else if (hasBookings) {
                    dateCell.style.border = "2px solid #ff0000"; // Red for bookings
                } else if (hasBlocks) {
                    dateCell.style.border = "2px solid #666666"; // Gray for blocks
                }
            }

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
                selectedTimeSlot = null;
                // Generate time slots for selected date
                generateTimeSlots();

                // Update bookings list
                updateBookingsList();

                // Update button states
                updateButtonStates();
            });

            calendarGrid.appendChild(dateCell);
        }
    }

    // Generate time slots
    function generateTimeSlots() {
        if (!selectedDate) return;
        // Clear previous time slots
        slotsContainer.innerHTML = '';

        const dateString = formatDate(selectedDate);

        const dateData = bookingsData[dateString] || {};

        // Generate time slots from 9 AM to 5 PM
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = document.createElement('div');
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

                // Check if time slot is booked or blocked
                const slotData = dateData[timeString];
                if (slotData) {

                    if (slotData.type === "booked") {
                        timeSlot.className = 'time-slot booked';
                        timeSlot.title = `Booked by: ${slotData.user}`;
                    } else if (slotData.type === "blocked") {
                        timeSlot.className = 'time-slot blocked';
                        timeSlot.title = 'Blocked by admin';

                    }
                } else {
                    timeSlot.className = 'time-slot available';
                }

                timeSlot.textContent = displayTime;
                timeSlot.dataset.time = timeString;


                timeSlot.addEventListener('click', function () {
                    // Remove selected class from all time slots
                    document.querySelectorAll('.time-slot').forEach(slot => {
                        slot.classList.remove('selected');
                    });

                    // Add selected class to clicked time slot
                    timeSlot.classList.add('selected');

                    // Update selected time slot
                    selectedTimeSlot = timeString;

                    // Enable/disable block/unblock buttons based on slot status
                    updateButtonStates();
                });
                slotsContainer.appendChild(timeSlot);
            }
        }
    }

    // Update bookings list for selected date
    function updateBookingsList() {
        if (!selectedDate) return;

        const dateString = formatDate(selectedDate);
        const dateData = bookingsData[dateString] || {};

        // Clear previous bookings
        bookingsList.innerHTML = '';

        // Sort time slots
        const sortedSlots = Object.keys(dateData).sort();

        if (sortedSlots.length === 0) {
            const noBookings = document.createElement('div');
            noBookings.className = 'booking-item';
            noBookings.textContent = 'No bookings or blocks for this date';
            bookingsList.appendChild(noBookings);
            return;
        }

        // Add each booking/block to the list
        sortedSlots.forEach(time => {
            const slotData = dateData[time];
            const bookingItem = document.createElement('div');
            bookingItem.className = 'booking-item';

            const displayTime = formatTimeForDisplay(time);

            bookingItem.innerHTML = `
                    <div>
                        <strong>${displayTime}</strong> - 
                        ${slotData.type === 'booked' ? 'Booked by ' + slotData.user : 'Blocked by admin'}
                    </div>
                    <div class="booking-actions">
                        ${slotData.type === 'booked' ?
                    `<button class="cancel-booking" data-time="${time}"data-booking-id="${slotData.bookingId}">Cancel Booking</button>` :
                    `<button class="unblock-slot" data-time="${time}">Unblock</button>`
                }
                    </div>
                `;

            bookingsList.appendChild(bookingItem);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.cancel-booking').forEach(button => {
            button.addEventListener('click', function () {
                const time = this.dataset.time;
                const bookingId = this.dataset.bookingId;
                showConfirmationModal(
                    'Cancel Booking',
                    `Are you sure you want to cancel the booking at ${formatTimeForDisplay(time)}?`,
                    () => cancelBooking(bookingId, dateString, time)
                );
            });
        });

        document.querySelectorAll('.unblock-slot').forEach(button => {
            button.addEventListener('click', function () {
                const time = this.dataset.time;
                const bookingId = this.dataset.bookingId;
                showConfirmationModal(
                    'Unblock Time Slot',
                    `Are you sure you want to unblock the time slot at ${formatTimeForDisplay(time)}?`,
                    () => unblockSlot(dateString, time)
                );
            });
        });
    }

    // Update button states based on selected time slot
    function updateButtonStates() {
        if (!selectedDate) {
            blockSlotBtn.disabled = true;
            unblockSlotBtn.disabled = true;
            return;
        }

        if (!selectedTimeSlot) {
            // No specific time slot selected, allow blocking entire date
            blockSlotBtn.disabled = false;
            blockSlotBtn.textContent = "Block Date";
            unblockSlotBtn.disabled = false;
            unblockSlotBtn.textContent = "Unblock Date";
            return;
        }

        const dateString = formatDate(selectedDate);
        const dateData = bookingsData[dateString] || {};
        const slotData = dateData[selectedTimeSlot];

        // Update button text to show we're working with time slots
        blockSlotBtn.textContent = "Block Time Slot";
        unblockSlotBtn.textContent = "Unblock Time Slot";

        blockSlotBtn.disabled = slotData && slotData.type === "blocked";
        unblockSlotBtn.disabled = !slotData || slotData.type !== "blocked";
    }

    // Block a time slot or entire date
    async function blockSlot(dateString, timeString = null) {
        if (!bookingsData[dateString]) {
            bookingsData[dateString] = {};
        }

        try {
            if (timeString) { // Block specific time slot
                console.log('blocking time slot: ', { dateString, timeString });

                const blockData = {
                    userId: 99999,
                    resourceId: currentResourceId,
                    date: dateString,
                    time_slot: timeString
                }
                console.log('BlockData package: ', blockData);
                const response = await fetch(`${API_BASE_URL}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify(blockData)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `HTTP ${response.status}`);
                }
                console.log('Time slot blocked successfully');

            } else { // Block entire date - all time slots from 9 AM to 5 PM
                console.log('blocking date slot: ', { dateString });

                for (let hour = 9; hour <= 17; hour++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

                        const blockData = {
                            userId: 99999,
                            resourceId: currentResourceId,
                            date: dateString,
                            time_slot: time
                        }
                        const response = await fetch(`${API_BASE_URL}/bookings`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(blockData)
                        });
                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(errorText || `HTTP ${response.status}`);
                        }
                        console.log('Time date blocked successfully');

                    }
                }
            }
        } catch (error) {
            console.error('Error blocking time slot:', error);
            alert('Failed to block time slot: ' + error.message);
        }
        // Refresh display
        await fetchAllBookings();
        generateTimeSlots();
        updateBookingsList();
        generateCalendar(currentDate);
        updateButtonStates();
    }

    // Unblock a time slot or entire date
    async function unblockSlot(dateString, timeString = null) {
        if (!bookingsData[dateString]) return;

        if (timeString) {
            try {
                // Unblock specific time slot
                const blockedId = bookingsData[dateString][timeString].bookingId;
                console.log('Unblocking blocked slot: ', { dateString, timeString }, " ", blockedId);

                const response = await fetch(`${API_BASE_URL}/bookings/${blockedId}`, {});

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                console.log('database booking successfully unblocked');

                if (bookingsData[dateString][timeString]) {
                    delete bookingsData[dateString][timeString];
                }
            } catch (error){
                console.error('Error unblocking booking:', error);
                alert('Failed to unblock booking: ' + error.message);
            }
        } else {
            // Unblock entire date - remove all blocked slots but keep bookings
            Object.keys(bookingsData[dateString]).forEach(async time => {
                try {
                    if (bookingsData[dateString][time].type === "blocked") {

                        const blockedId = bookingsData[dateString][time].bookingId;
                        console.log('Unblocking blocked slot: ', { dateString, timeString }, " ", blockedId);

                        const response = await fetch(`${API_BASE_URL}/bookings/${blockedId}`, {});

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        delete bookingsData[dateString][time];
                    }
                } catch (error) {
                    // console.error('Error unblocking booking:', error);
                    alert('Failed to unblock date: ' + error.message);
                }
            });
        }
        // If no more slots for this date, remove the date entry
        if (Object.keys(bookingsData[dateString]).length === 0) {
            delete bookingsData[dateString];
        }
        // Refresh display
        await fetchAllBookings();
        generateTimeSlots();
        updateBookingsList();
        generateCalendar(currentDate);
        updateButtonStates();
    }

    // Cancel a booking
    async function cancelBooking(bookingId, dateString, timeString) {
        try {
            console.log('cancelling booking: ', bookingId);

            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {});

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('database booking successfully cancelled');

            if (bookingsData[dateString] && bookingsData[dateString][timeString]) {
                delete bookingsData[dateString][timeString];

                // If no more slots for this date, remove the date entry
                if (Object.keys(bookingsData[dateString]).length === 0) {
                    delete bookingsData[dateString];
                }

                console.log('local booking successfully cancelled');

                // Refresh display
                await fetchAllBookings();
                generateTimeSlots();
                updateBookingsList();
                generateCalendar(currentDate);
            }

        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking: ' + error.message);
        }



    }

    // Show confirmation modal
    function showConfirmationModal(title, message, confirmCallback) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'flex';

        // Set up confirm button
        modalConfirm.onclick = function () {
            modal.style.display = 'none';
            confirmCallback();
        };

        // Set up cancel button
        modalCancel.onclick = function () {
            modal.style.display = 'none';
        };
    }

    // Utility functions
    function formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTimeForDisplay(timeString) {
        const [hour, minute] = timeString.split(':');
        const hourNum = parseInt(hour);
        const displayHour = hourNum > 12 ? hourNum - 12 : hourNum;
        const amPm = hourNum >= 12 ? 'PM' : 'AM';
        return `${displayHour}:${minute} ${amPm}`;
    }

    // Event listeners for month navigation
    prevMonthBtn.addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate);
        updateButtonStates();
    });

    nextMonthBtn.addEventListener('click', function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate);
        updateButtonStates();
    });

    // Event listeners for admin controls
    blockSlotBtn.addEventListener('click', function () {
        if (!selectedDate) {
            alert('Please select a date first');
            return;
        }

        const dateString = formatDate(selectedDate);

        if (!selectedTimeSlot) {
            // Block entire date
            showConfirmationModal(
                'Block Entire Date',
                `Are you sure you want to block all time slots on ${selectedDate.toLocaleDateString()}?`,
                () => blockSlot(dateString)
            );
        } else {
            // Block specific time slot
            showConfirmationModal(
                'Block Time Slot',
                `Are you sure you want to block the time slot at ${formatTimeForDisplay(selectedTimeSlot)} on ${selectedDate.toLocaleDateString()}?`,
                () => blockSlot(dateString, selectedTimeSlot)
            );
        }
    });

    unblockSlotBtn.addEventListener('click', function () {
        if (!selectedDate) {
            alert('Please select a date first');
            return;
        }

        const dateString = formatDate(selectedDate);

        if (!selectedTimeSlot) {
            // Unblock entire date
            showConfirmationModal(
                'Unblock Entire Date',
                `Are you sure you want to unblock all time slots on ${selectedDate.toLocaleDateString()}?`,
                () => unblockSlot(dateString)
            );
        } else {
            // Unblock specific time slot
            showConfirmationModal(
                'Unblock Time Slot',
                `Are you sure you want to unblock the time slot at ${formatTimeForDisplay(selectedTimeSlot)} on ${selectedDate.toLocaleDateString()}?`,
                () => unblockSlot(dateString, selectedTimeSlot)
            );
        }
    });


    refreshBtn.addEventListener('click', async function () {
        try {
            await fetchAllBookings();
            generateCalendar(currentDate);
            updateButtonStates();
            alert('Bookings refreshed successfully');
        } catch (error) {
            alert('Failed to refresh bookings: ' + error.message);
        }
    });
    // Initialize calendar and time slots
    generateCalendar(currentDate);
    generateTimeSlots(selectedDate);
    updateButtonStates();
});
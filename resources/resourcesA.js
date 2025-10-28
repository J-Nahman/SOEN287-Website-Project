    document.addEventListener('DOMContentLoaded', function() {
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
        
        let currentDate = new Date();
        let selectedDate = null;
        let selectedTimeSlot = null;
        
        // Generate hardcoded bookings for the next week
        function generateHardcodedBookings() {
            const bookings = {};
            const today = new Date();
            
            // Bookings for today + 1 day
            const day1 = new Date(today);
            day1.setDate(today.getDate() + 1);
            const day1String = formatDate(day1);
            bookings[day1String] = {
                "09:00": { user: "John Smith", type: "booking" },
                "10:30": { user: "Maria Garcia", type: "booking" },
                "14:00": { user: "David Johnson", type: "booking" }
            };
            
            // Bookings for today + 2 days
            const day2 = new Date(today);
            day2.setDate(today.getDate() + 2);
            const day2String = formatDate(day2);
            bookings[day2String] = {
                "11:00": { user: "Sarah Williams", type: "booking" },
                "13:30": { user: "Michael Brown", type: "booking" },
                "15:30": { user: "Emily Davis", type: "booking" }
            };
            
            // Bookings for today + 3 days
            const day3 = new Date(today);
            day3.setDate(today.getDate() + 3);
            const day3String = formatDate(day3);
            bookings[day3String] = {
                "09:30": { user: "Robert Miller", type: "booking" },
                "12:00": { user: "Lisa Wilson", type: "booking" },
                "16:00": { user: "James Taylor", type: "booking" }
            };
            
            // Bookings for today + 4 days
            const day4 = new Date(today);
            day4.setDate(today.getDate() + 4);
            const day4String = formatDate(day4);
            bookings[day4String] = {
                "10:00": { user: "Jennifer Anderson", type: "booking" },
                "14:30": { user: "Thomas Martinez", type: "booking" }
            };
            
            // Bookings for today + 5 days
            const day5 = new Date(today);
            day5.setDate(today.getDate() + 5);
            const day5String = formatDate(day5);
            bookings[day5String] = {
                "13:00": { user: "Jessica Thomas", type: "booking" },
                "15:00": { user: "Christopher Lee", type: "booking" }
            };
            
            // Bookings for today + 6 days
            const day6 = new Date(today);
            day6.setDate(today.getDate() + 6);
            const day6String = formatDate(day6);
            bookings[day6String] = {
                "09:00": { user: "Amanda White", type: "booking" },
                "11:30": { user: "Daniel Clark", type: "booking" },
                "14:00": { user: "Michelle Harris", type: "booking" },
                "16:30": { user: "Kevin Lewis", type: "booking" }
            };
            
            // Bookings for today + 7 days
            const day7 = new Date(today);
            day7.setDate(today.getDate() + 7);
            const day7String = formatDate(day7);
            bookings[day7String] = {
                "10:30": { user: "Rachel Walker", type: "booking" },
                "12:30": { user: "Jason Hall", type: "booking" }
            };
            
            return bookings;
        }
        
        // Initialize hardcoded bookings data
        let bookingsData = generateHardcodedBookings();
        
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
                dateCell.addEventListener('click', function() {
                    // Remove selected class from all dates
                    document.querySelectorAll('.calendar-date').forEach(cell => {
                        cell.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked date
                    dateCell.classList.add('selected');
                    
                    // Update selected date
                    selectedDate = new Date(year, month, i);
                    
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
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
                    
                    // Check if time slot is booked or blocked
                    const slotData = dateData[timeString];
                    
                    if (slotData) {
                        if (slotData.type === "booking") {
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
                    
                    timeSlot.addEventListener('click', function() {
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
                        ${slotData.type === 'booking' ? 'Booked by ' + slotData.user : 'Blocked by admin'}
                    </div>
                    <div class="booking-actions">
                        ${slotData.type === 'booking' ? 
                            `<button class="cancel-booking" data-time="${time}">Cancel Booking</button>` : 
                            `<button class="unblock-slot" data-time="${time}">Unblock</button>`
                        }
                    </div>
                `;
                
                bookingsList.appendChild(bookingItem);
            });
            
            // Add event listeners to action buttons
            document.querySelectorAll('.cancel-booking').forEach(button => {
                button.addEventListener('click', function() {
                    const time = this.dataset.time;
                    showConfirmationModal(
                        'Cancel Booking',
                        `Are you sure you want to cancel the booking at ${formatTimeForDisplay(time)}?`,
                        () => cancelBooking(dateString, time)
                    );
                });
            });
            
            document.querySelectorAll('.unblock-slot').forEach(button => {
                button.addEventListener('click', function() {
                    const time = this.dataset.time;
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
        function blockSlot(dateString, timeString = null) {
            if (!bookingsData[dateString]) {
                bookingsData[dateString] = {};
            }
            
            if (timeString) {
                // Block specific time slot
                bookingsData[dateString][timeString] = { user: "Admin", type: "blocked" };
            } else {
                // Block entire date - all time slots from 9 AM to 5 PM
                for (let hour = 9; hour <= 17; hour++) {
                    for (let minute = 0; minute < 60; minute += 30) {
                        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                        bookingsData[dateString][time] = { user: "Admin", type: "blocked" };
                    }
                }
            }
            
            // Refresh display
            generateTimeSlots();
            updateBookingsList();
            generateCalendar(currentDate);
            updateButtonStates();
        }
        
        // Unblock a time slot or entire date
        function unblockSlot(dateString, timeString = null) {
            if (!bookingsData[dateString]) return;
            
            if (timeString) {
                // Unblock specific time slot
                if (bookingsData[dateString][timeString]) {
                    delete bookingsData[dateString][timeString];
                }
            } else {
                // Unblock entire date - remove all blocked slots but keep bookings
                Object.keys(bookingsData[dateString]).forEach(time => {
                    if (bookingsData[dateString][time].type === "blocked") {
                        delete bookingsData[dateString][time];
                    }
                });
            }
            
            // If no more slots for this date, remove the date entry
            if (Object.keys(bookingsData[dateString]).length === 0) {
                delete bookingsData[dateString];
            }
            
            // Refresh display
            generateTimeSlots();
            updateBookingsList();
            generateCalendar(currentDate);
            updateButtonStates();
        }
        
        // Cancel a booking
        function cancelBooking(dateString, timeString) {
            if (bookingsData[dateString] && bookingsData[dateString][timeString]) {
                delete bookingsData[dateString][timeString];
                
                // If no more slots for this date, remove the date entry
                if (Object.keys(bookingsData[dateString]).length === 0) {
                    delete bookingsData[dateString];
                }
                
                // Refresh display
                generateTimeSlots();
                updateBookingsList();
                generateCalendar(currentDate);
            }
        }
        
        // Show confirmation modal
        function showConfirmationModal(title, message, confirmCallback) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.style.display = 'flex';
            
            // Set up confirm button
            modalConfirm.onclick = function() {
                modal.style.display = 'none';
                confirmCallback();
            };
            
            // Set up cancel button
            modalCancel.onclick = function() {
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
        prevMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate);
            updateButtonStates();
        });
        
        nextMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate);
            updateButtonStates();
        });
        
        // Event listeners for admin controls
        blockSlotBtn.addEventListener('click', function() {
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
        
        unblockSlotBtn.addEventListener('click', function() {
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
        
        // Initialize calendar and time slots
        generateCalendar(currentDate);
        updateButtonStates();
    });
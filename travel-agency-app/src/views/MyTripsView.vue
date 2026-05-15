<script setup>
import { computed, onMounted, ref } from 'vue'
import { tenantConfig } from '../config/tenantConfig.js'
import { bookingService } from '../services/bookingService.js'
import { useAuth } from '../composables/useAuth.js'

const { userId, userEmail } = useAuth()

const isLoading = ref(true)
const errorMessage = ref('')
const trips = ref([])
const editingBookingId = ref(null)
const editStartDate = ref('')
const editEndDate = ref('')
const editError = ref('')
const isSavingEdit = ref(false)

function formatDate(value) {
  if (!value) return 'N/A'

  const raw = String(value).split('T')[0]
  const parts = raw.split('-')

  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day} ${new Date(Number(year), Number(month) - 1, Number(day)).toLocaleString('en-GB', {
      month: 'short',
    })} ${year}`
  }

  return value
}

const tripCountLabel = computed(() => {
  const tripCount = trips.value.length
  return tripCount === 1 ? '1 saved trip' : `${tripCount} saved trips`
})

async function loadTrips() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    trips.value = await bookingService.listBookings({
      userId: userId.value,
      agentId: tenantConfig.agentId,
    })
  } catch (error) {
    errorMessage.value = error.message || 'Unable to load saved trips.'
    trips.value = []
  } finally {
    isLoading.value = false
  }
}

function startEdit(trip) {
  editingBookingId.value = trip.bookingId
  editStartDate.value = trip.startDate
  editEndDate.value = trip.endDate
  editError.value = ''
}

function cancelEdit() {
  editingBookingId.value = null
  editStartDate.value = ''
  editEndDate.value = ''
  editError.value = ''
}

async function saveEdit(trip) {
  isSavingEdit.value = true
  editError.value = ''

  try {
    // Update parent booking
    await bookingService.updateBooking(trip.bookingId, {
      Start_Date: editStartDate.value,
      End_Date: editEndDate.value,
    })

    // Update hotel reservations
    await Promise.all(
      trip.hotelReservations.map((hotel) =>
        bookingService.updateHotelReservation(
          trip.bookingId,
          hotel.Reservation_No,
          {
            Check_In_Date: editStartDate.value,
            Check_Out_Date: editEndDate.value,
          }
        )
      )
    )

    // Update flight reservations
    await Promise.all(
      trip.flightReservations.map((flight, index) => {
        const flightDate = index === 0 ? editStartDate.value : editEndDate.value

        return bookingService.updateFlightReservation(
          trip.bookingId,
          flight.Reservation_No,
          {
            Departure_Date: flightDate,
            Arrive_Date: flightDate,
          }
        )
      })
    )

    cancelEdit()
    await loadTrips()
  } catch (error) {
    editError.value = error.message || 'Unable to update booking.'
  } finally {
    isSavingEdit.value = false
  }
}

onMounted(() => {
  loadTrips()
})
</script>

<template>
  <div class="my-trips-view">
    <div class="my-trips-view__hero">
      <div>
        <p class="my-trips-view__eyebrow">Agent {{ tenantConfig.agentId }}</p>
        <h1 class="my-trips-view__title">My Trips</h1>
        <p class="my-trips-view__sub">
          Saved trips for {{ userEmail || `User ${userId}` }} with {{ tenantConfig.brandName }}.
        </p>
      </div>
      <div class="my-trips-view__summary">{{ tripCountLabel }}</div>
    </div>

    <div v-if="isLoading" class="state-card">Loading saved trips...</div>
    <div v-else-if="errorMessage" class="state-card state-card--error">{{ errorMessage }}</div>
    <div v-else-if="trips.length === 0" class="state-card">No saved trips found for this user and agent.</div>

    <div v-else class="trips-list">
      <article v-for="trip in trips" :key="trip.bookingId" class="trip-card">
        <div class="trip-card__header">
          <div>
            <p class="trip-card__meta">Booking #{{ trip.bookingId }}</p>
            <h2 class="trip-card__title">{{ formatDate(trip.startDate) }} to {{ formatDate(trip.endDate) }}</h2>
          </div>
          <div class="trip-card__pill">{{ trip.flightReservations.length }} flights · {{ trip.hotelReservations.length }} hotels</div>
          <div class="trip-card__actions">
            <button class="btn-edit" @click="startEdit(trip)">Edit</button>
          </div>
        </div>

        <div v-if="editingBookingId === trip.bookingId" class="edit-panel">
          <label>
            Start date
            <input v-model="editStartDate" type="date" />
          </label>

          <label>
            End date
            <input v-model="editEndDate" type="date" />
          </label>

          <button :disabled="isSavingEdit" @click="saveEdit(trip)">
            {{ isSavingEdit ? 'Saving...' : 'Save' }}
          </button>

          <button :disabled="isSavingEdit" @click="cancelEdit">
            Cancel
          </button>

          <p v-if="editError" class="edit-panel__error">{{ editError }}</p>
        </div>

        <section class="trip-section">
          <h3 class="trip-section__title">Flight Details</h3>
          <p v-if="trip.flightReservations.length === 0" class="trip-section__empty">No flights saved for this trip.</p>
          <div v-else class="reservation-grid">
            <div v-for="flight in trip.flightReservations" :key="`${trip.bookingId}-${flight.Reservation_No}`" class="reservation-card">
              <div class="reservation-card__title">Flight Reservation</div>
              <div><strong>Airline code:</strong> {{ flight.Airline_Code || 'N/A' }}</div>
              <div><strong>Flight number:</strong> {{ flight.Flight_Number || 'N/A' }}</div>
              <div>{{ flight.Origin_Airport_Code }} to {{ flight.Destination_Airport_Code }}</div>
              <div>Departure: {{ formatDate(flight.Departure_Date) }} {{ flight.Departure_Time }}</div>
              <div>Arrival: {{ formatDate(flight.Arrive_Date) }} {{ flight.Arrive_Time }}</div>
              <div>Rate: ${{ Number(flight.Rate || 0).toLocaleString() }}</div>
            </div>
          </div>
        </section>

        <section class="trip-section">
          <h3 class="trip-section__title">Hotel Details</h3>
          <p v-if="trip.hotelReservations.length === 0" class="trip-section__empty">No hotel saved for this trip.</p>
          <div v-else class="reservation-grid">
            <div v-for="hotel in trip.hotelReservations" :key="`${trip.bookingId}-${hotel.Reservation_No}`" class="reservation-card">
              <div class="reservation-card__title">Hotel Reservation</div>
              <div><strong>Hotal Name:</strong> {{ hotel.Hotel_Name || 'Hotel name unavailable' }}</div>
              <div>Check in: {{ formatDate(hotel.Check_In_Date) }} {{ hotel.Check_In_Time }}</div>
              <div>Check out: {{ formatDate(hotel.Check_Out_Date) }} {{ hotel.Check_Out_Time }}</div>
              <div>Rate: ${{ Number(hotel.Rate || 0).toLocaleString() }}</div>
            </div>
          </div>
        </section>
      </article>
    </div>
  </div>
</template>

<style scoped>
.my-trips-view {
  min-height: calc(100vh - 56px);
  background: var(--color-bg);
  padding: 2rem;
}

.my-trips-view__hero {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.my-trips-view__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-dark);
}

.my-trips-view__title {
  margin: 0;
  font-size: 2rem;
  color: var(--color-primary-dark);
}

.my-trips-view__sub {
  margin: 0.5rem 0 0;
  color: var(--color-text-muted);
}

.my-trips-view__summary {
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 700;
}

.state-card {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 2rem;
  color: var(--color-text-muted);
}

.state-card--error {
  color: #c0392b;
}

.trips-list {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trip-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 10px 24px rgba(26, 54, 93, 0.06);
}

.trip-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.trip-card__meta {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.trip-card__title {
  margin: 0;
  color: var(--color-primary-dark);
  font-size: 1.2rem;
}

.trip-card__pill {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.trip-section + .trip-section {
  margin-top: 1.25rem;
}

.trip-section__title {
  margin: 0 0 0.75rem;
  color: var(--color-text);
  font-size: 1rem;
}

.trip-section__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.reservation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.reservation-card {
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 1rem;
  background: #fcfdff;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.reservation-card__title {
  font-weight: 700;
  color: var(--color-primary-dark);
}

@media (max-width: 768px) {
  .my-trips-view {
    padding: 1rem;
  }

  .my-trips-view__hero,
  .trip-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

.trip-card__actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: #fff;
  cursor: pointer;
  font-weight: 700;
}

.edit-panel {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid var(--color-border);
}

.edit-panel label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-weight: 700;
  font-size: 0.85rem;
}

.edit-panel input {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.edit-panel button {
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.edit-panel__error {
  color: #c0392b;
  width: 100%;
  margin: 0.5rem 0 0;
}
</style>
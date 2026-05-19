import axios from 'axios'

const DESTINATION_ALIASES = {
  'NEW YORK': 'New York, USA',
  JFK: 'New York, USA',
  LGA: 'New York, USA',
  EWR: 'New York, USA',
  'LOS ANGELES': 'Los Angeles, USA',
  LAX: 'Los Angeles, USA',
  'SAN FRANCISCO': 'San Francisco, USA',
  SFO: 'San Francisco, USA',
  PARIS: 'Paris, France',
  CDG: 'Paris, France',
  ORY: 'Paris, France',
  LONDON: 'London, UK',
  LHR: 'London, UK',
  LGW: 'London, UK',
  TOKYO: 'Tokyo, Japan',
  NRT: 'Tokyo, Japan',
  HND: 'Tokyo, Japan',
  HONOLULU: 'Honolulu, USA',
  HNL: 'Honolulu, USA',
  CHICAGO: 'Chicago, USA',
  ORD: 'Chicago, USA',
  MDW: 'Chicago, USA',
  MIAMI: 'Miami, USA',
  MIA: 'Miami, USA',
  SEATTLE: 'Seattle, USA',
  SEA: 'Seattle, USA',
  BOSTON: 'Boston, USA',
  BOS: 'Boston, USA',
  DUBAI: 'Dubai, UAE',
  DXB: 'Dubai, UAE',
  SINGAPORE: 'Singapore',
  SIN: 'Singapore',
  SYDNEY: 'Sydney, Australia',
  SYD: 'Sydney, Australia',
  SEOUL: 'Seoul, South Korea',
  ICN: 'Seoul, South Korea',
  BANGKOK: 'Bangkok, Thailand',
  BKK: 'Bangkok, Thailand',
  FRANKFURT: 'Frankfurt, Germany',
  FRA: 'Frankfurt, Germany',
  AMSTERDAM: 'Amsterdam, Netherlands',
  AMS: 'Amsterdam, Netherlands',
  TORONTO: 'Toronto, Canada',
  YYZ: 'Toronto, Canada',
  VANCOUVER: 'Vancouver, Canada',
  YVR: 'Vancouver, Canada',
  MADRID: 'Madrid, Spain',
  MAD: 'Madrid, Spain',
  ROME: 'Rome, Italy',
  FCO: 'Rome, Italy',
}

const CITY_COORDINATES = {
  'New York, USA': { lat: 40.7128, lon: -74.0060 },
  'Los Angeles, USA': { lat: 34.0522, lon: -118.2437 },
  'San Francisco, USA': { lat: 37.7749, lon: -122.4194 },
  'Paris, France': { lat: 48.8566, lon: 2.3522 },
  'London, UK': { lat: 51.5072, lon: -0.1276 },
  'Tokyo, Japan': { lat: 35.6762, lon: 139.6503 },
  'Honolulu, USA': { lat: 21.3069, lon: -157.8583 },
  'Chicago, USA': { lat: 41.8781, lon: -87.6298 },
  'Miami, USA': { lat: 25.7617, lon: -80.1918 },
  'Seattle, USA': { lat: 47.6062, lon: -122.3321 },
  'Boston, USA': { lat: 42.3601, lon: -71.0589 },
  'Dubai, UAE': { lat: 25.2048, lon: 55.2708 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'Sydney, Australia': { lat: -33.8688, lon: 151.2093 },
  'Seoul, South Korea': { lat: 37.5665, lon: 126.9780 },
  'Bangkok, Thailand': { lat: 13.7563, lon: 100.5018 },
  'Frankfurt, Germany': { lat: 50.1109, lon: 8.6821 },
  'Amsterdam, Netherlands': { lat: 52.3676, lon: 4.9041 },
  'Toronto, Canada': { lat: 43.6532, lon: -79.3832 },
  'Vancouver, Canada': { lat: 49.2827, lon: -123.1207 },
  'Madrid, Spain': { lat: 40.4168, lon: -3.7038 },
  'Rome, Italy': { lat: 41.9028, lon: 12.4964 },
}

const COUNTRY_ALIASES = {
  USA: 'United States',
  US: 'United States',
  UK: 'United Kingdom',
  UAE: 'United Arab Emirates',
  KOREA: 'South Korea',
}

const CATEGORY_ICONS = {
  culture: '🏛️',
  culinary: '🍷',
  food: '🍷',
  adventure: '🧗',
  relaxation: '🧘',
  nature: '🌿',
  nightlife: '🌃',
  shopping: '🛍️',
  sports: '⛷️',
  family: '👨‍👩‍👧‍👦',
  sightseeing: '📸',
}

const ACTIVITY_API_BASE_URL = import.meta.env.VITE_ACTIVITY_API_BASE_URL?.replace(/\/$/, '')
const ACTIVITY_API_TIMEOUT_MS = Number(import.meta.env.VITE_ACTIVITY_API_TIMEOUT_MS) || 20000

function getApiErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail
  const detailMessage = Array.isArray(detail)
    ? detail.map((item) => item?.msg || 'invalid request').join('; ')
    : typeof detail === 'string'
      ? detail
      : ''

  return detailMessage || error?.response?.data?.message || error?.message || fallbackMessage
}

function isTimeoutError(error) {
  return error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout')
}

function normalizeDestination(input) {
  const raw = String(input || '').trim().toUpperCase()
  if (!raw) return ''

  const parenCodeMatch = raw.match(/\(([A-Z]{3})\)/)
  const code = parenCodeMatch ? parenCodeMatch[1] : (/^[A-Z]{3}$/.test(raw) ? raw : null)

  if (code && DESTINATION_ALIASES[code]) return DESTINATION_ALIASES[code]
  if (DESTINATION_ALIASES[raw]) return DESTINATION_ALIASES[raw]
  return String(input || '').trim()
}

function normalizeCountryName(value) {
  const country = String(value || '').trim()
  if (!country) return 'United States'

  const upper = country.toUpperCase()
  return COUNTRY_ALIASES[upper] || country
}

function getApiDestination(destination) {
  const normalizedDestination = normalizeDestination(destination)
  const [cityName, countryLabel] = normalizedDestination.split(',').map((part) => part?.trim())

  return {
    dest_name: cityName || normalizedDestination || destination,
    country_name: normalizeCountryName(countryLabel),
    normalizedDestination,
  }
}

function extractAttractions(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.features)) return payload.features
  if (Array.isArray(payload?.products)) return payload.products
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.attractions)) return payload.attractions
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function getAmountValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function getPricePerPerson(item) {
  return getAmountValue(
    item.amount
      ?? item.price
      ?? item.price_per_person
      ?? item.ticket_price
      ?? item.min_price
      ?? item.retail_price
      ?? item.representativePrice?.publicAmount
      ?? item.representativePrice?.chargeAmount
      ?? item.pricing?.amount
      ?? item.pricing?.price
      ?? item.pricing?.value
      ?? item.priceBreakdown?.total?.units
      ?? item.unifiedPriceBreakdown?.price?.units
  )
}

function getCategory(item) {
  return item.category || item.category_name || item.type || item.attraction_type || 'Experience'
}

function getIcon(category) {
  return CATEGORY_ICONS[String(category || '').toLowerCase()] || '🎯'
}

function mapAttraction(item, index, searchParams, normalizedDestination) {
  const place = item.properties || item

  const adultCount = Number(searchParams.adults) || 1
  const childCount = Math.max(0, Number(searchParams.children) || 0)
  const passengers = Math.max(1, adultCount + childCount)

  return {
    id: String(place.place_id ?? place.id ?? `PARK-${index}`),

    name:
      place.name
      || place.address_line1
      || 'Park',

    category:
      place.categories?.[0]
      || 'Park',

    icon: '🌳',

    location: normalizedDestination,

    duration: '1-2h',

    pricePerPerson: 0,

    totalPrice: 0,

    maxGroupSize: 20,

    rating: '0.0',

    reviews: 0,

    description:
      place.address_line2
      || place.formatted
      || 'Outdoor park or nature location.',
  }
}

async function searchActivitiesViaApi(searchParams) {
  if (!ACTIVITY_API_BASE_URL) {
    throw new Error('VITE_ACTIVITY_API_BASE_URL is not configured.')
  }

  const { normalizedDestination } = getApiDestination(searchParams.destination)
  const coordinates = CITY_COORDINATES[normalizedDestination]

  if (!coordinates) {
    throw new Error(`No park search coordinates configured for ${normalizedDestination}`)
  }

  let response

  try {
    response = await axios.get(`${ACTIVITY_API_BASE_URL}/attractions/search`, {
      params: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        radius: 10000,
        limit: 20,
      },
      headers: {
        accept: 'application/json',
      },
      timeout: ACTIVITY_API_TIMEOUT_MS,
    })
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error('Park search timed out. Please try again.')
    }
    throw new Error(getApiErrorMessage(error, 'Park search failed.'))
  }

  return extractAttractions(response.data)
    .map((item, index) => mapAttraction(item, index, searchParams, normalizedDestination))
    .filter((activity) => activity.pricePerPerson >= 0)
    .sort((left, right) => left.pricePerPerson - right.pricePerPerson)
}

export const activityService = {
  async search({ destination, fromDate, toDate, adults, children }) {
    const activities = await searchActivitiesViaApi({
      destination,
      fromDate,
      toDate,
      adults,
      children,
    })

    if (activities.length === 0) {
      throw new Error('No activities returned from the activity API.')
    }

    return activities
  },
}

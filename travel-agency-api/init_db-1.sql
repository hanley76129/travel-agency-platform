-- =========================================================================
-- TRAVEL BOOKING SYSTEM INITIALIZATION SCRIPT
-- Purpose: Build optimized schema and seed with realistic test data.
-- =========================================================================

DROP TABLE IF EXISTS Activity_Reservations;
DROP TABLE IF EXISTS Flight_Reservations;
DROP TABLE IF EXISTS Hotel_Reservations;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Airport_Master;
DROP TABLE IF EXISTS Airline_Master;
DROP TABLE IF EXISTS Hotel_Master;
DROP TABLE IF EXISTS Agents;
DROP TABLE IF EXISTS Users;

CREATE TABLE Users (
    User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    First_Name TEXT NOT NULL,
    Last_Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Phone_Number TEXT
);

CREATE TABLE Agents (
    Agent_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Phone TEXT
);

CREATE TABLE Hotel_Master (
    Hotel_Code INTEGER PRIMARY KEY AUTOINCREMENT,
    Hotel_Name TEXT NOT NULL,
    Address TEXT,
    City TEXT NOT NULL,
    Zip_Code TEXT,
    Country TEXT NOT NULL,
    Email TEXT,
    Phone_Number TEXT,
    UNIQUE(Hotel_Name, City, Country)
);

CREATE TABLE Airline_Master (
    Airline_Code TEXT PRIMARY KEY,
    Airline_Name TEXT NOT NULL
);

CREATE TABLE Airport_Master (
    Airport_Code TEXT PRIMARY KEY,
    Airport_Name TEXT NOT NULL,
    City TEXT NOT NULL,
    Country TEXT NOT NULL
);

CREATE TABLE Bookings (
    Booking_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    User_Id INTEGER NOT NULL,
    Agent_Id INTEGER,
    Start_Date TEXT NOT NULL,
    End_Date TEXT NOT NULL,
    FOREIGN KEY (User_Id) REFERENCES Users(User_Id),
    FOREIGN KEY (Agent_Id) REFERENCES Agents(Agent_Id)
);

CREATE TABLE Hotel_Reservations (
    Reservation_No INTEGER PRIMARY KEY AUTOINCREMENT,
    Booking_Id INTEGER NOT NULL,
    Hotel_Code INTEGER NOT NULL,
    Check_In_Date TEXT NOT NULL,
    Check_In_Time TEXT,
    Check_Out_Date TEXT NOT NULL,
    Check_Out_Time TEXT,
    Rate REAL,
    FOREIGN KEY (Booking_Id) REFERENCES Bookings(Booking_Id),
    FOREIGN KEY (Hotel_Code) REFERENCES Hotel_Master(Hotel_Code)
);

CREATE TABLE Flight_Reservations (
    Reservation_No INTEGER PRIMARY KEY AUTOINCREMENT,
    Booking_Id INTEGER NOT NULL,
    Airline_Code TEXT NOT NULL,
    Flight_Number TEXT NOT NULL,
    Departure_Date TEXT NOT NULL,
    Departure_Time TEXT NOT NULL,
    Arrive_Date TEXT NOT NULL,
    Arrive_Time TEXT NOT NULL,
    Rate REAL,
    Origin_Airport_Code TEXT NOT NULL,
    Destination_Airport_Code TEXT NOT NULL,
    FOREIGN KEY (Booking_Id) REFERENCES Bookings(Booking_Id),
    FOREIGN KEY (Airline_Code) REFERENCES Airline_Master(Airline_Code),
    FOREIGN KEY (Origin_Airport_Code) REFERENCES Airport_Master(Airport_Code),
    FOREIGN KEY (Destination_Airport_Code) REFERENCES Airport_Master(Airport_Code)
);

CREATE TABLE Activity_Reservations (
    Activity_Reservation_Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Booking_Id INTEGER NOT NULL,
    Activity_Name TEXT NOT NULL,
    Location TEXT,
    Activity_Date TEXT NOT NULL,
    Price REAL,
    FOREIGN KEY (Booking_Id) REFERENCES Bookings(Booking_Id)
);

-- Seed Users
INSERT INTO Users (First_Name, Last_Name, Email, Phone_Number) VALUES
('John', 'Doe', 'john.doe@example.com', '555-123-4567'),
('Jane', 'Smith', 'jane.smith@email.co.uk', '44-20-7946-0958'),
('Hanley', 'Huynh', 'hanley.huynh@example.com', '555-000-0000');

-- Seed Agents
INSERT INTO Agents (Name, Email, Phone) VALUES
('Global Travel Solutions', 'support@gtstravel.com', '1-800-555-0199'),
('Independent Agent Bob', 'bob@bobsbookings.biz', '555-987-6543');

-- Seed Hotel_Master
INSERT INTO Hotel_Master (Hotel_Name, Address, City, Zip_Code, Country, Email) VALUES
('The Plaza', '768 5th Ave', 'New York', '10019', 'USA', 'reservations@theplazany.com'),
('The Savoy', 'Strand', 'London', 'WC2R 0EU', 'UK', 'savoy.reservations@fairmont.com'),
('Hotel California', '123 Sunset Blvd', 'Los Angeles', '90210', 'USA', 'youcanneverleave@hc.com');

-- Seed Airline_Master
INSERT INTO Airline_Master (Airline_Code, Airline_Name) VALUES
('AA', 'American Airlines'),
('BA', 'British Airways'),
('DL', 'Delta Air Lines'),
('VS', 'Virgin Atlantic');

-- Seed Airport_Master
INSERT INTO Airport_Master (Airport_Code, Airport_Name, City, Country) VALUES
('JFK', 'John F. Kennedy International', 'New York', 'USA'),
('SFO', 'San Francisco International', 'San Francisco', 'USA'),
('LHR', 'London Heathrow', 'London', 'UK'),
('LAX', 'Los Angeles International', 'Los Angeles', 'USA'),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France');

-- Seed Bookings
INSERT INTO Bookings (User_Id, Agent_Id, Start_Date, End_Date) VALUES
(1, NULL, '2024-06-01', '2024-06-21'),
(2, 1, '2024-08-15', '2024-08-25'),
(3, NULL, '2026-06-01', '2026-06-10');

-- Seed Hotel_Reservations
INSERT INTO Hotel_Reservations (Booking_Id, Hotel_Code, Check_In_Date, Check_In_Time, Check_Out_Date, Rate) VALUES
(1, 2, '2024-06-02', '14:00', '2024-06-19', 450.00);

INSERT INTO Hotel_Reservations (Booking_Id, Hotel_Code, Check_In_Date, Check_Out_Date, Rate) VALUES
(2, 3, '2024-08-15', '2024-08-25', 299.99),
(3, 1, '2026-06-01', '2026-06-10', 500.00);

-- Seed Flight_Reservations
INSERT INTO Flight_Reservations (Booking_Id, Airline_Code, Flight_Number, Departure_Date, Departure_Time, Arrive_Date, Arrive_Time, Rate, Origin_Airport_Code, Destination_Airport_Code) VALUES
(1, 'BA', '112', '2024-06-01', '18:30', '2024-06-02', '06:30', 850.00, 'JFK', 'LHR'),
(1, 'BA', '113', '2024-06-21', '10:15', '2024-06-21', '13:10', 850.00, 'LHR', 'JFK'),
(2, 'DL', '45', '2024-08-15', '07:00', '2024-08-15', '10:05', 315.50, 'JFK', 'LAX'),
(3, 'AA', '101', '2026-06-01', '08:00', '2026-06-01', '16:00', 400.00, 'SFO', 'JFK');

-- Seed Activity_Reservations
INSERT INTO Activity_Reservations (Booking_Id, Activity_Name, Location, Activity_Date, Price) VALUES
(1, 'Thames River Sunset Cruise', 'Tower Pier, London', '2024-06-05', 75.00),
(2, 'Warner Bros Studio Tour', 'Burbank, CA', '2024-08-18', 69.00),
(2, 'Santa Monica Pier Bike Rental', 'Santa Monica', '2024-08-20', 25.00);
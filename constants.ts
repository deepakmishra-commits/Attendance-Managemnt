import { GeoCoords } from './types';

// Virtual Office Location (e.g., a central point in Bangalore for demo)
export const OFFICE_COORDS: GeoCoords = {
  lat: 12.9716,
  lng: 77.5946
};

export const ATTENDANCE_RADIUS_METERS = 2000; // 2km radius

export const COMPANY_NAME = "TechFlow Solutions India Pvt Ltd";
export const COMPANY_ADDRESS = "Unit 402, Tech Park, Bangalore, KA 560001";
export const CURRENCY_SYMBOL = "₹";

// Time after which a user is considered late (Hours, Minutes)
export const OFFICE_START_HOUR = 10;
export const OFFICE_LATE_THRESHOLD_MINUTES = 15; 

// SQL Schema Reference (For documentation/MsSQL integration context)
export const SQL_SCHEMA_DOCS = `
-- Microsoft SQL Server Schema Design

CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(256) NOT NULL,
    Role NVARCHAR(20) CHECK (Role IN ('Admin', 'Manager', 'Employee')),
    Department NVARCHAR(50),
    BaseSalary DECIMAL(18, 2),
    JoinDate DATE,
    IsActive BIT DEFAULT 1
);

CREATE TABLE Attendance (
    AttendanceID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Date DATE NOT NULL,
    CheckInTime DATETIME,
    CheckOutTime DATETIME,
    Status NVARCHAR(20),
    Latitude FLOAT,
    Longitude FLOAT,
    IsRemote BIT DEFAULT 0,
    CONSTRAINT UC_User_Date UNIQUE (UserID, Date)
);

CREATE TABLE SalarySlips (
    SlipID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    MonthYear CHAR(7), -- YYYY-MM
    GeneratedDate DATETIME DEFAULT GETDATE(),
    BasicAmount DECIMAL(18, 2),
    HRA DECIMAL(18, 2),
    Deductions DECIMAL(18, 2),
    Tax DECIMAL(18, 2),
    NetSalary DECIMAL(18, 2)
);

CREATE TABLE AuditLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    RecordID INT, -- Links to AttendanceID
    ChangedBy NVARCHAR(100),
    Timestamp DATETIME DEFAULT GETDATE(),
    OldValue NVARCHAR(MAX),
    NewValue NVARCHAR(MAX),
    Reason NVARCHAR(255)
);
`;
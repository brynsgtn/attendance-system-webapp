import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { formatDate } from "../utils/date";
import { formatTime } from "../utils/time";
import { useAttendanceStore } from "../store/attendanceStore";
import { motion } from "framer-motion";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { SearchX } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import * as XLSX from 'xlsx';
import { toast } from "react-hot-toast"

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const TeamTable = ({ refreshKey }) => {
    const { isDarkMode, isLoading, user } = useAuthStore();
    const { getTeamMembersAttendance } = useAttendanceStore();
    const [currentPage, setCurrentPage] = useState(1);
    const [teamAttendance, setTeamAttendance] = useState([]);
    const rowsPerPage = 5;
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [attendanceLoading, setAttendanceLoading] = useState(true);


    useEffect(() => {
        const getAttendance = async () => {
            if (!user._id) {
                console.error("User ID is not available");
                setAttendanceLoading(false);
                return;
            }

            try {
                setAttendanceLoading(true);
                const response = await getTeamMembersAttendance(user._id);
                console.log("API Response:", response);

                if (response && response.data && response.data.attendance) {
                    console.log("Attendance Data:", response.data.attendance);
                    setTeamAttendance(response.data.attendance);
                } else {
                    console.error("Attendance data not found in response");
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            } finally {
                setAttendanceLoading(false);
            }
        };
        setCurrentPage(1);

        getAttendance();
    }, [user._id, refreshKey, getTeamMembersAttendance, selectedDate]);

    const handleViewOpenModal = (record) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const handleViewCloseModal = () => {
        setIsViewModalOpen(false);
        setSelectedRecord(null);
    };

    const calculateWorkHours = (timeIn, timeOut, isApproved) => {
        // Convert the time_in and time_out to local time
        const timeInLocal = dayjs(timeIn).local();
        const timeOutLocal = dayjs(timeOut).local();

        // Define the work day window
        const workStart = timeInLocal.set('hour', 9).set('minute', 0).set('second', 0); // 9 AM
        const workEnd = timeInLocal.set('hour', 18).set('minute', 0).set('second', 0);  // 6 PM

        // Adjust time_in and time_out to fit the work window
        const adjustedStart = timeInLocal.isBefore(workStart) ? workStart : timeInLocal;  // If before 9 AM, start at 9 AM
        const adjustedEnd = timeOutLocal.isAfter(workEnd) ? workEnd : timeOutLocal;  // If after 6 PM, end at 6 PM

        // Calculate the difference between adjusted start and end times in minutes
        const totalMinutes = adjustedEnd.diff(adjustedStart, 'minute');

        // If the time_in is after the work_end or time_out is before work_start, return 0
        if (totalMinutes <= 0) {
            return "N/A";  // If no valid working time, return N/A
        }

        // Convert minutes to hours
        let totalHours = totalMinutes / 60;

        // Apply lunch break deduction rules
        if (totalHours > 5) {
            totalHours -= 1; // Deduct 1 hour for lunch
            console.log('Debug after lunch deduction:', totalHours);
        } else if (totalHours > 4 && totalHours <= 5) {
            totalHours = 4; // Cap at 4 hours for 4-5 hour periods
            console.log('Debug capped at 4 hours');
        }

        // Check if the request was approved and if the time_out was after 6 PM
        if (isApproved === "approved" && timeOutLocal.isAfter(workEnd)) {
            // Add the extra time after 6 PM to the total hours
            const overtimeMinutes = timeOutLocal.diff(workEnd, 'minute');
            totalHours += overtimeMinutes / 60;  // Add overtime to the total hours
            return `${totalHours.toFixed(2)} hrs (including overtime)`;
        }

        return totalHours.toFixed(2) + " hrs";
    };

    const filteredAttendance = selectedDate
        ? teamAttendance.filter((record) =>
            dayjs(record.time_in).format('YYYY-MM-DD') === selectedDate
        )
        : teamAttendance;

    if (isLoading || attendanceLoading) {
        return <LoadingSpinner />;
    }


    const handleExportToExcel = () => {
        try {
            if (!filteredAttendance || filteredAttendance.length === 0) {
                toast.error("No attendance data available to export.");
                return;
            }

            const exportData = filteredAttendance.map((record) => {
                const fullName = `${record.user.full_name || ""}`;
                const date = dayjs(record.time_in).format("YYYY-MM-DD");
                const timeIn = dayjs(record.time_in).format("hh:mm A");
                const hasValidTimeOut = record.time_out && dayjs(record.time_out).isValid();
                const timeOut = hasValidTimeOut ? dayjs(record.time_out).format("hh:mm A") : "No timeout";

                let hours = calculateWorkHours(record.time_in, record.time_out, record.status);
                let hoursValue = parseFloat(hours);
                hours = isNaN(hoursValue) ? "Incomplete / Pending Request" : hoursValue.toFixed(2);

                return {
                    Name: fullName,
                    Date: date,
                    "Time In": timeIn,
                    "Time Out": record.time_out ? timeOut : "No Time Out",
                    Hours: hours,
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Interns Attendance");

            const sheetTitle = "Interns_Attendance_" + dayjs().format("YYYYMMDD_HHmmss");
            XLSX.writeFile(workbook, `${sheetTitle}.xlsx`);

            toast.success("Excel file has been successfully exported!");
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Something went wrong while exporting.");
        }
    };


    if (!Array.isArray(filteredAttendance) || filteredAttendance.length === 0) {
        return (
            <>
                <div className="mb-4 flex justify-between items-center">
                    <label className="text-sm font-medium mr-2">Filter by Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                    />
                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate('')}
                            className={`ml-2 text-sm ${isDarkMode ? "text-emerald-500" : "text-blue-500"} hover:cursor-pointer`}
                        >
                            <SearchX size={20} />
                        </button>
                    )}
                </div>
                <div className={`flex justify-center items-center ${isDarkMode ? "bg-gray-900" : "bg-white"} p-4 min-h-[200px]`}>
                    <div className="text-lg text-gray-500">
                        No attendance records found.
                    </div>
                </div>
            </>

        );
    }


    const totalPages = Math.ceil(filteredAttendance.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentRecords = filteredAttendance.slice(startIndex, startIndex + rowsPerPage);


    return (
        <>
            <div className="mt-4 flex items-center">
                <label className="text-sm font-medium mr-2">Filter by Date:</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`border rounded px-2 py-1 ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}
                />
                {selectedDate && (
                    <button
                        onClick={() => setSelectedDate('')}
                        className={`ml-2 text-sm ${isDarkMode ? "text-emerald-500" : "text-blue-500"} hover:cursor-pointer`}
                    >
                        <SearchX size={20} />
                    </button>
                )}
                <div className="relative group ms-auto">
                    <button
                        onClick={handleExportToExcel}
                        className={`px-2 py-2 rounded-md transition-colors duration-300 flex items-center hover:cursor-pointer
		${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-black"}`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>

                    {/* Tooltip */}
                    <div
                        role="tooltip"
                        className={`absolute top-full right-0 mb-2 px-3 py-2 text-sm font-medium rounded-lg border shadow-md whitespace-nowrap z-50 
        ${isDarkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-900 border-gray-200"} 
        opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                    >
                        Export to Excel
                    </div>
                </div>

            </div>


            <div className={`overflow-x-auto ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"} p-4 rounded-lg`}>

                <table className={`min-w-full ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                    <thead className={isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-500"}>
                        <tr>
                            {["Name", "Date", "Time In", "Time Out", "Team", "Action"].map((header) => (
                                <th key={header} className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}>
                        {currentRecords.map((record, index) => (
                            <motion.tr
                                key={record._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`transition ${isDarkMode ? "hover:bg-gray-500" : "hover:bg-gray-100"}`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.user.full_name ?? "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatDate(record.time_in)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {formatTime(record.time_in)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.time_out == null ? 'no time-out' : formatTime(record.time_out)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {record.user.team}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleViewOpenModal(record)}
                                        className="text-blue-400 hover:cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>


                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                        >
                            Previous
                        </button>

                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isViewModalOpen}
                onClose={handleViewCloseModal}
                record={selectedRecord}
                isDarkMode={isDarkMode}
            />

        </>
    );
};

export default TeamTable;

const Modal = ({ isOpen, onClose, onEditClick, record, isDarkMode }) => {
    if (!isOpen || !record) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl w-full max-w-lg shadow-xl border ${isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}
            >
                <h2 className="text-2xl font-semibold mb-4">Attendance Details</h2>
                <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {record.user.full_name}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(record.time_in)}</p>
                    <p><span className="font-medium">Time In:</span> {formatTime(record.time_in)}</p>
                    <p><span className="font-medium">Time Out:</span> {record.time_out ? formatTime(record.time_out) : 'N/A'}</p>
                    <p><span className="font-medium">Hours:</span> {record.total_hours ? `${parseFloat(record.total_hours).toFixed(2)} hrs` : 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {record.status}</p>
                    {record.status === "approved" && <p><span className="font-medium">Reason:</span> {record.request_reason}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition duration-200 
                        bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

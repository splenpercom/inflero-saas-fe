import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useState } from "react";
import { Search, ChevronDown, User, Mail, Phone, FileText, Plus, X, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "./ui/utils";

type ReservationStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface Reservation {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  status: ReservationStatus;
  notes?: string;
  assignedTable?: string;
}

interface Table {
  id: string;
  name: string;
  area: string;
  seats: number;
}

export function Reservations() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [weekFilter, setWeekFilter] = useState("current");
  const [startDate, setStartDate] = useState("09/02/2026");
  const [endDate, setEndDate] = useState("15/02/2026");
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [isAssignTableModalOpen, setIsAssignTableModalOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);

  // Mock data
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "1",
      customerName: "dee",
      email: "ddedd",
      phone: "45434534",
      guests: 2,
      date: "11/02/2026",
      time: "01:00 PM",
      status: "confirmed",
      notes: "no",
      assignedTable: "T-4",
    },
    {
      id: "2",
      customerName: "John Smith",
      email: "john@example.com",
      phone: "55534534",
      guests: 4,
      date: "12/02/2026",
      time: "07:00 PM",
      status: "pending",
      notes: "Birthday celebration",
    },
    {
      id: "3",
      customerName: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "66634534",
      guests: 6,
      date: "13/02/2026",
      time: "06:30 PM",
      status: "confirmed",
      assignedTable: "T-10",
    },
    {
      id: "4",
      customerName: "Mike Brown",
      email: "mike@example.com",
      phone: "77734534",
      guests: 3,
      date: "14/02/2026",
      time: "08:00 PM",
      status: "cancelled",
      notes: "Changed plans",
    },
  ]);

  // Mock tables data
  const tables: Table[] = [
    { id: "T-10", name: "T-10", area: "lounge", seats: 6 },
    { id: "T-4", name: "T-4", area: "lounge", seats: 4 },
    { id: "T-5", name: "T-5", area: "lounge", seats: 2 },
    { id: "T-9", name: "T-9", area: "lounge", seats: 5 },
    { id: "T-1", name: "T-1", area: "roofTop", seats: 6 },
    { id: "T-2", name: "T-2", area: "roofTop", seats: 3 },
    { id: "T-8", name: "T-8", area: "roofTop", seats: 3 },
  ];

  // New Reservation Form State
  const [newReservationForm, setNewReservationForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    guests: 2,
    date: "",
    time: "",
    notes: "",
  });

  const filteredReservations = reservations.filter((reservation) => {
    const query = searchQuery.toLowerCase();
    return (
      reservation.customerName.toLowerCase().includes(query) ||
      reservation.email.toLowerCase().includes(query) ||
      reservation.phone.includes(query)
    );
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded uppercase">
            {t.confirmed}
          </span>
        );
      case "pending":
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded uppercase">
            {t.pending}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded uppercase">
            {t.cancelled}
          </span>
        );
      case "completed":
        return (
          <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded uppercase">
            {t.completed}
          </span>
        );
    }
  };

  const handleCreateReservation = () => {
    const newReservation: Reservation = {
      id: String(Date.now()),
      ...newReservationForm,
      status: "pending",
    };
    setReservations([...reservations, newReservation]);
    setIsNewReservationModalOpen(false);
    setNewReservationForm({
      customerName: "",
      email: "",
      phone: "",
      guests: 2,
      date: "",
      time: "",
      notes: "",
    });
  };

  const handleAssignTable = (reservationId: string, tableId: string) => {
    setReservations(
      reservations.map((res) =>
        res.id === reservationId ? { ...res, assignedTable: tableId } : res
      )
    );
    setIsAssignTableModalOpen(false);
    setSelectedReservationId(null);
  };

  const handleChangeStatus = (reservationId: string, newStatus: ReservationStatus) => {
    setReservations(
      reservations.map((res) =>
        res.id === reservationId ? { ...res, status: newStatus } : res
      )
    );
    setOpenStatusDropdown(null);
  };

  const getStatusLabel = (status: ReservationStatus) => {
    switch (status) {
      case "confirmed":
        return t.confirmed;
      case "pending":
        return t.pending;
      case "cancelled":
        return t.cancelled;
      case "completed":
        return t.completed;
      default:
        return status;
    }
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.reservationsPage}
        </h1>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-2 mb-6">
        {/* Week Filter */}
        <div className="relative">
          <button className="flex items-center justify-between w-full lg:w-auto gap-2 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <span>{t.currentWeek}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 lg:flex-none lg:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="09/02/2026"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t.to}</span>
          <input
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 lg:flex-none lg:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15/02/2026"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchByNameEmailPhone}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        {/* New Reservation Button */}
        <button
          onClick={() => setIsNewReservationModalOpen(true)}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.newReservation}
        </button>
      </div>

      {/* Reservations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
          >
            {/* Header with Assign Table button and Status */}
            <div className="flex items-start justify-between mb-3">
              <button
                onClick={() => {
                  setSelectedReservationId(reservation.id);
                  setIsAssignTableModalOpen(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {reservation.assignedTable ? reservation.assignedTable : t.assignTable}
              </button>
              {getStatusBadge(reservation.status)}
            </div>

            {/* Guest Count and Date/Time */}
            <div className="flex items-start justify-between mb-3">
              <div className="text-xs font-semibold text-gray-900 dark:text-white">
                {reservation.guests} {t.guests}
              </div>
              <div className="text-right">
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  {reservation.date} {reservation.time}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2 mb-3">
              {/* Name */}
              <div className="flex items-center gap-2 text-xs">
                <User className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {reservation.customerName}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {reservation.email}
                </span>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  {reservation.phone}
                </span>
              </div>

              {/* Notes */}
              <div className="flex items-start gap-2 text-xs">
                <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">
                  {reservation.notes || t.noNotes}
                </span>
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpenStatusDropdown(
                    openStatusDropdown === reservation.id ? null : reservation.id
                  )
                }
                className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="capitalize">{getStatusLabel(reservation.status)}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {openStatusDropdown === reservation.id && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => handleChangeStatus(reservation.id, "confirmed")}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>{t.confirmed}</span>
                    {reservation.status === "confirmed" && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleChangeStatus(reservation.id, "pending")}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>{t.pending}</span>
                    {reservation.status === "pending" && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleChangeStatus(reservation.id, "cancelled")}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>{t.cancelled}</span>
                    {reservation.status === "cancelled" && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleChangeStatus(reservation.id, "completed")}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                  >
                    <span>{t.completed}</span>
                    {reservation.status === "completed" && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No reservations found
          </p>
        </div>
      )}

      {/* New Reservation Modal */}
      <Dialog open={isNewReservationModalOpen} onOpenChange={setIsNewReservationModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.newReservation}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.newReservationDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.customerName || "Customer Name"}
              </label>
              <input
                type="text"
                value={newReservationForm.customerName}
                onChange={(e) =>
                  setNewReservationForm({ ...newReservationForm, customerName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.email || "Email"}
              </label>
              <input
                type="email"
                value={newReservationForm.email}
                onChange={(e) =>
                  setNewReservationForm({ ...newReservationForm, email: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.phone || "Phone"}
              </label>
              <input
                type="tel"
                value={newReservationForm.phone}
                onChange={(e) =>
                  setNewReservationForm({ ...newReservationForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.guests || "Guests"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={newReservationForm.guests}
                  onChange={(e) =>
                    setNewReservationForm({ ...newReservationForm, guests: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.date || "Date"}
                </label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={newReservationForm.date}
                  onChange={(e) =>
                    setNewReservationForm({ ...newReservationForm, date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.time || "Time"}
              </label>
              <input
                type="text"
                placeholder="HH:MM AM/PM"
                value={newReservationForm.time}
                onChange={(e) =>
                  setNewReservationForm({ ...newReservationForm, time: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.notes || "Notes"}
              </label>
              <textarea
                value={newReservationForm.notes}
                onChange={(e) =>
                  setNewReservationForm({ ...newReservationForm, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setIsNewReservationModalOpen(false)}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                onClick={handleCreateReservation}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t.create || "Create"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Table Modal */}
      <Dialog open={isAssignTableModalOpen} onOpenChange={setIsAssignTableModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.assignTable}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.assignTableDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  if (selectedReservationId) {
                    handleAssignTable(selectedReservationId, table.id);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{table.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {table.area} • {table.seats} {t.seats || "seats"}
                    </div>
                  </div>
                </div>
                {selectedReservationId &&
                  reservations.find((r) => r.id === selectedReservationId)?.assignedTable ===
                    table.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
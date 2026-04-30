'use client';

import { useEffect, useState, useRef } from 'react';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { Skeleton } from '@/app/components/Skeleton';
import type { AppointmentDto, BarberDto, ShopSettingsDto } from '@/types/domain';

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [settings, setSettings] = useState<ShopSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [apptsRes, barbersRes, settingsRes] = await Promise.all([
          fetch(`/api/appointments?from=${selectedDate}&to=${selectedDate}&limit=100`),
          fetch('/api/barbers'),
          fetch('/api/settings'),
        ]);

        const [apptsData, barbersData, settingsData] = await Promise.all([
          apptsRes.json(),
          barbersRes.json(),
          settingsRes.json(),
        ]);

        setAppointments(apptsData.data || []);
        setBarbers((barbersData.barbers || []).filter((b: BarberDto) => b.isActive));
        setSettings(settingsData.settings || null);
      } catch (error) {
        console.error('Failed to fetch bookings data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevDay = () => {
    const prev = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handlePickDate = () => {
    dateInputRef.current?.showPicker();
  };

  const shopStartHour = 9; // Default if settings not loaded
  const shopEndHour = 23;
  const totalHours = shopEndHour - shopStartHour;
  const totalMinutes = totalHours * 60;

  const getPosition = (timeStr: string) => {
    const date = parseISO(timeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minutesFromStart = (hours - shopStartHour) * 60 + minutes;
    return Math.max(0, Math.min(100, (minutesFromStart / totalMinutes) * 100));
  };

  const getWidth = (durationMinutes: number) => {
    return (durationMinutes / totalMinutes) * 100;
  };

  const stats = {
    revenue: appointments.reduce((sum, a) => sum + Number(a.serviceTotal), 0),
    completion: appointments.length > 0 
      ? Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) 
      : 0,
    activeStaff: barbers.length,
    totalAppts: appointments.length,
  };

  const isToday = isSameDay(parseISO(selectedDate), new Date());
  const currentTimePosition = getPosition(currentTime.toISOString());

  return (
    <main className="px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header & Date Picker Section */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-2">
            Daily Schedule
          </h2>
          <p className="text-on-surface-variant font-body-md">
            Managing {stats.totalAppts} appointments for {format(parseISO(selectedDate), 'EEEE, dd-MM-yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-lg border border-outline-variant">
          <button 
            onClick={handlePrevDay}
            className="p-2 hover:bg-surface-container-lowest rounded-md transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="px-4 py-2 font-label-md text-on-surface text-center min-w-[140px]">
            {isToday ? 'Today, ' : ''}{format(parseISO(selectedDate), 'dd-MM-yyyy')}
          </div>
          <button 
            onClick={handleNextDay}
            className="p-2 hover:bg-surface-container-lowest rounded-md transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className="relative">
            <input 
              type="date"
              ref={dateInputRef}
              className="absolute opacity-0 pointer-events-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button 
              onClick={handlePickDate}
              className="ml-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span className="material-symbols-outlined">calendar_today</span>
              PICK DATE
            </button>
          </div>
        </div>
      </section>

      {/* Stats Overview Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="text-primary" />
        <StatCard title="Completion" value={`${stats.completion}%`} />
        <StatCard title="Appointments" value={stats.totalAppts} />
        <StatCard title="Staff Active" value={`${stats.activeStaff} Barbers`} />
      </section>

      {/* Schedule Grid */}
      <section className="relative bg-surface-container-lowest rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Time Header */}
            <div className="flex border-b border-outline-variant bg-surface-container-lowest">
              <div className="w-32 py-4 px-6 border-r border-outline-variant"></div>
              <div className="flex-1 flex">
                {Array.from({ length: totalHours + 1 }).map((_, i) => (
                  <div key={i} className="flex-1 py-4 px-4 text-center border-r border-outline-variant font-label-md text-tertiary">
                    {String(shopStartHour + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Barber Rows */}
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex border-b border-outline-variant h-32">
                  <div className="w-32 p-6 border-r border-outline-variant bg-surface-container-low">
                    <Skeleton className="w-12 h-12 rounded-full mb-2" />
                    <Skeleton className="w-16 h-4" />
                  </div>
                  <div className="flex-1 bg-surface-container-high/20"></div>
                </div>
              ))
            ) : barbers.length === 0 ? (
              <div className="py-20 text-center text-on-surface-variant font-body-lg">
                No active barbers found.
              </div>
            ) : (
              barbers.map((barber) => (
                <div key={barber.id} className="flex border-b border-outline-variant group min-h-[120px]">
                  <div className="w-32 py-8 px-6 border-r border-outline-variant bg-surface-container-low flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-headline-small uppercase border-2 border-primary-container shadow-sm">
                      {barber.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-label-md text-on-surface text-center leading-tight">{barber.name || 'Unknown'}</span>
                  </div>
                  <div className="flex-1 relative bg-surface-container-high/30">
                    {appointments
                      .filter(a => a.barberId === barber.id)
                      .map(appt => (
                        <AppointmentBlock 
                          key={appt.id} 
                          appointment={appt} 
                          left={getPosition(appt.startTime)}
                          width={getWidth(appt.durationMinutes)}
                        />
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current Time Indicator */}
        {isToday && currentTimePosition > 0 && currentTimePosition < 100 && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-error z-10 transition-all duration-1000"
            style={{ left: `calc(128px + (100% - 128px) * ${currentTimePosition / 100})` }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-error"></div>
            <div className="absolute top-2 left-2 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
              {format(currentTime, 'hh:mm a')}
            </div>
          </div>
        )}
      </section>

      {/* Service Distribution (Simplified for now) */}
      <section className="mt-12 mb-12">
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant">
          <h4 className="font-headline-md mb-6">Service Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {Object.entries(
               appointments.reduce((acc, a) => {
                 a.services.forEach(s => acc[s.name] = (acc[s.name] || 0) + 1);
                 return acc;
               }, {} as Record<string, number>)
             ).map(([name, count]) => (
               <div key={name} className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                 <p className="text-on-surface-variant font-label-sm uppercase">{name}</p>
                 <p className="text-headline-small font-headline-small">{count} appts</p>
               </div>
             ))}
             {appointments.length === 0 && <p className="col-span-full text-center text-on-surface-variant py-8">No data for this day.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value, color = 'text-on-surface' }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-outline-variant">
      <p className="font-label-md text-tertiary uppercase mb-2">{title}</p>
      <h3 className={`font-headline-lg text-headline-lg ${color}`}>{value}</h3>
    </div>
  );
}

function AppointmentBlock({ appointment, left, width }: { appointment: AppointmentDto; left: number; width: number }) {
  const statusColor = 
    appointment.status === 'completed' ? 'bg-green-500/20 text-green-700 border-green-200' :
    appointment.status === 'cancelled' ? 'bg-error/10 text-error border-error/20' :
    'bg-primary-container/30 text-on-primary-container border-primary-container/50';

  return (
    <div 
      className={`absolute top-4 h-20 p-3 rounded-lg shadow-sm border transition-all hover:z-20 hover:shadow-md cursor-pointer overflow-hidden ${statusColor}`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: '100px' }}
    >
      <div className="flex justify-between items-start mb-0.5">
        <span className="font-label-md truncate mr-1">
          {appointment.customerName || 'Anonymous'}
        </span>
        <span className="text-[10px] font-bold shrink-0">
          {format(parseISO(appointment.startTime), 'HH:mm')}
        </span>
      </div>
      <p className="text-[11px] opacity-80 truncate">
        {appointment.services.map(s => s.name).join(', ')}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${
          appointment.status === 'completed' ? 'bg-green-500' :
          appointment.status === 'cancelled' ? 'bg-error' : 'bg-yellow-500 animate-pulse'
        }`}></span>
        <span className="text-[9px] uppercase font-bold tracking-wider opacity-70">
          {appointment.status}
        </span>
      </div>
    </div>
  );
}

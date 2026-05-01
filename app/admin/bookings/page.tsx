'use client';

import { useEffect, useState, useRef } from 'react';
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns';
import { Skeleton } from '@/app/components/Skeleton';
import type { AppointmentDto, BarberDto } from '@/types/domain';

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [apptsRes, barbersRes] = await Promise.all([
          fetch(`/api/appointments?from=${selectedDate}&to=${selectedDate}&limit=100`),
          fetch('/api/barbers'),
        ]);

        const [apptsData, barbersData] = await Promise.all([
          apptsRes.json(),
          barbersRes.json(),
        ]);

        setAppointments(apptsData.data || []);
        setBarbers((barbersData.barbers || []).filter((b: BarberDto) => b.isActive));
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
    <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen">
      {/* Header & Date Picker Section */}
      <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Operational Flow</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">daily <span className="text-primary">schedule</span></h2>
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
            Managing {stats.totalAppts} appointments for {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy').toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-md shadow-technical border border-white/5">
          <button 
            onClick={handlePrevDay}
            className="w-12 h-12 flex items-center justify-center hover:bg-surface-container-high rounded-sm transition-all active:scale-90 text-on-surface-variant opacity-40 hover:opacity-100"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div className="px-8 font-display-lg text-xl text-on-surface text-center min-w-[200px] tracking-tighter lowercase">
            {isToday ? 'today, ' : ''}{format(parseISO(selectedDate), 'dd MMM yyyy').toLowerCase()}
          </div>
          <button 
            onClick={handleNextDay}
            className="w-12 h-12 flex items-center justify-center hover:bg-surface-container-high rounded-sm transition-all active:scale-90 text-on-surface-variant opacity-40 hover:opacity-100"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <div className="relative border-l border-outline-variant/10 ml-2 pl-2">
            <input 
              type="date"
              ref={dateInputRef}
              className="absolute opacity-0 pointer-events-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button 
              onClick={handlePickDate}
              className="w-12 h-12 bg-primary text-on-primary rounded-sm shadow-technical hover:opacity-90 transition-all flex items-center justify-center active:scale-90"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Overview Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
        <StatCard title="Daily Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="text-primary" />
        <StatCard title="Performance" value={`${stats.completion}%`} />
        <StatCard title="Bookings" value={stats.totalAppts} />
        <StatCard title="Staffing" value={`${stats.activeStaff}`} />
      </section>

      {/* Schedule Grid */}
      <section className="relative bg-surface-container-low rounded-lg shadow-technical overflow-hidden mb-24 border border-white/5">
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[1200px]">
            {/* Time Header */}
            <div className="flex bg-surface-container-high/30 border-b border-outline-variant/10">
              <div className="w-40 py-8 px-10 border-r border-outline-variant/10 flex items-center gap-3">
                 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                 <span className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Protocol</span>
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: totalHours + 1 }).map((_, i) => (
                  <div key={i} className="flex-1 py-8 px-6 text-center border-r border-outline-variant/10 font-display-lg text-lg text-on-surface-variant opacity-20 lowercase tracking-tighter">
                    {String(shopStartHour + i).padStart(2, '0')}h
                  </div>
                ))}
              </div>
            </div>

            {/* Barber Rows */}
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex border-b border-outline-variant/10 h-40">
                  <div className="w-40 p-10 border-r border-outline-variant/10 bg-surface-container-high/10">
                    <Skeleton className="w-16 h-16 rounded-md mb-4" />
                    <Skeleton className="w-20 h-2 rounded-full opacity-20" />
                  </div>
                  <div className="flex-1 bg-surface-container-high/5"></div>
                </div>
              ))
            ) : (
              barbers.map((barber) => (
                <div key={barber.id} className="flex border-b border-outline-variant/10 group min-h-[160px] last:border-0">
                  <div className="w-40 py-12 px-8 border-r border-outline-variant/10 bg-surface-container-high/20 flex flex-col items-center gap-4 transition-colors group-hover:bg-primary/5">
                    <div className="w-16 h-16 rounded-md bg-surface-container-high flex items-center justify-center font-display-lg text-2xl text-on-surface-variant shadow-technical group-hover:bg-primary group-hover:text-on-primary transition-all duration-500 lowercase tracking-tighter">
                      {barber.name?.charAt(0) || '?'}
                    </div>
                    <span className="font-display-lg text-lg text-on-surface text-center leading-tight opacity-40 group-hover:opacity-100 transition-opacity lowercase tracking-tighter">{barber.name || 'unknown'}</span>
                  </div>
                  <div className="flex-1 relative bg-surface-container-high/5">
                    <div className="absolute inset-0 flex">
                       {Array.from({ length: totalHours + 1 }).map((_, i) => (
                         <div key={i} className="flex-1 border-r border-outline-variant/10"></div>
                       ))}
                    </div>
                    {appointments
                      .filter(a => a.barberId === barber.id)
                      .map(appt => (
                        <AppointmentBlock 
                          key={appt.id} 
                          appointment={appt} 
                          left={getPosition(appt.startTime)}
                          width={getWidth(appt.durationMinutes)}
                          onClick={() => setSelectedAppointment(appt)}
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
            className="absolute top-0 bottom-0 w-px bg-primary z-10 transition-all duration-1000 shadow-[0_0_15px_rgba(0,60,161,0.5)]"
            style={{ left: `calc(160px + (100% - 160px) * ${currentTimePosition / 100})` }}
          >
            <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
            <div className="absolute top-4 left-4 bg-primary text-on-primary text-[9px] font-bold px-3 py-1.5 rounded-sm shadow-technical whitespace-nowrap uppercase tracking-[0.2em]">
              Real-time • {format(currentTime, 'HH:mm')}
            </div>
          </div>
        )}
      </section>

      {/* Service Distribution */}
      <section className="mb-24">
        <div className="bg-surface-container p-12 rounded-lg">
          <div className="flex items-center justify-between mb-10">
            <h4 className="font-display-lg text-headline-lg">Service Performance</h4>
            <div className="w-20 h-1 bg-tertiary rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {Object.entries(
               appointments.reduce((acc, a) => {
                 a.services.forEach(s => acc[s.name] = (acc[s.name] || 0) + 1);
                 return acc;
               }, {} as Record<string, number>)
             ).map(([name, count]) => (
               <div key={name} className="flex flex-col gap-2">
                 <p className="text-on-surface-variant font-label-md uppercase tracking-widest opacity-50">{name}</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-display-lg font-headline-lg">{count}</span>
                    <span className="text-body-md text-on-surface-variant opacity-60">sessions</span>
                 </div>
               </div>
             ))}
             {appointments.length === 0 && <p className="col-span-full text-center text-on-surface-variant py-8 font-body-lg">No sessions recorded for this date.</p>}
          </div>
        </div>
      </section>

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          barber={barbers.find((barber) => barber.id === selectedAppointment.barberId) ?? null}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </main>
  );
}

function StatCard({ title, value, color = 'text-on-surface' }: { title: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface-container-low p-10 rounded-lg transition-all hover:bg-surface-container-high group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity"></div>
      <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] mb-4 opacity-50 group-hover:opacity-100 transition-all text-[10px]">{title}</p>
      <h3 className={`font-display-lg text-display-lg ${color} leading-none tracking-tighter`}>{value}</h3>
    </div>
  );
}

function AppointmentBlock({
  appointment,
  left,
  width,
  onClick,
}: {
  appointment: AppointmentDto;
  left: number;
  width: number;
  onClick: () => void;
}) {
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-6 h-28 p-6 rounded-md shadow-technical transition-all hover:z-20 hover:scale-[1.01] cursor-pointer overflow-hidden flex flex-col justify-between text-left group/appt border-l-[6px] ${
        isCompleted ? 'bg-surface-container-highest/50 text-on-surface-variant border-outline' :
        isCancelled ? 'bg-error-container/20 text-on-error-container border-error opacity-40' :
        'bg-surface-container-highest text-on-surface border-primary'
      }`}
      style={{ left: `${left}%`, width: `${width}%`, minWidth: '160px' }}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <span className="font-headline-md text-sm truncate mr-2 tracking-tight">
            {appointment.customerName || 'Anonymous'}
          </span>
          <span className="text-[10px] font-bold shrink-0 opacity-40 uppercase tracking-widest">
            {format(parseISO(appointment.startTime), 'HH:mm')}
          </span>
        </div>
        <p className="text-[10px] opacity-60 truncate font-label-md uppercase tracking-widest">
          {appointment.services.map(s => s.name).join(' + ')}
        </p>
      </div>
      
      <div className="flex items-center gap-3 mt-4 relative z-10">
        <span className={`w-2 h-2 rounded-full ${
          isCompleted ? 'bg-outline' :
          isCancelled ? 'bg-error' : 'bg-primary shadow-[0_0_8px_var(--color-primary)]'
        }`}></span>
        <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
          {appointment.status}
        </span>
      </div>
    </button>
  );
}

function AppointmentDetailsModal({
  appointment,
  barber,
  onClose,
}: {
  appointment: AppointmentDto;
  barber: BarberDto | null;
  onClose: () => void;
}) {
  const totalPaid = Number(appointment.serviceTotal);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-surface-container-low rounded-lg shadow-technical overflow-hidden border border-white/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-10 py-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${appointment.status === 'completed' ? 'bg-primary' : 'bg-on-surface-variant opacity-20'}`}></span>
              <span className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Session Dossier</span>
            </div>
            <h3 className="font-display-lg text-3xl text-on-surface tracking-tighter lowercase">
              {appointment.customerName || 'Anonymous'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant opacity-40 hover:opacity-100 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-10 p-10">
          <div className="space-y-8">
            <DetailCard label="Protocol Status" value={appointment.status} />
            <DetailCard label="Financial State" value={appointment.paymentStatus} />
            <DetailCard label="Assigned Artisan" value={barber?.name || 'Unassigned'} />
          </div>

          <div className="space-y-8 text-right">
            <DetailCard label="Temporal Scope" value={`${appointment.durationMinutes} min`} />
            <DetailCard label="Total Valuation" value={`₹${totalPaid.toFixed(0)}`} />
            <DetailCard label="Reference ID" value={appointment.id.slice(0, 12)} mono />
          </div>
        </div>

        <div className="p-10 bg-surface-container-high/10 border-t border-outline-variant/10">
          <label className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[9px] opacity-40 block mb-8">Manifest Services</label>
          <div className="space-y-6">
            {appointment.services.map((service) => (
              <div
                key={service.serviceId}
                className="flex items-center justify-between pb-6 border-b border-outline-variant/5 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-display-lg text-xl text-on-surface lowercase tracking-tighter">{service.name}</p>
                  <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">{service.durationMinutes} minutes duration</p>
                </div>
                <p className="font-display-lg text-2xl text-primary tracking-tighter">₹{service.price.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="font-label-md uppercase tracking-[0.2em] text-on-surface-variant opacity-30 text-[9px]">{label}</p>
      <p className={`text-on-surface lowercase tracking-tighter ${mono ? 'font-mono text-sm opacity-60' : 'font-display-lg text-2xl'}`}>{value}</p>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileSpreadsheet, QrCode, Mail, MessageCircle, Link2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import QRCodeLib from 'qrcode';

interface ExportMenuProps {
  itinerary: any;
  agentType: string;
}

export function ExportMenu({ itinerary, agentType }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataURL, setQRDataURL] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExportExcel = () => {
    const { dayStructure, activities, restaurants, accommodations } = itinerary;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create overview sheet
    const overviewData = [
      ['Road Trip Itinerary'],
      ['Agent Type', agentType],
      ['Duration', `${dayStructure?.days?.length || 0} days`],
      [],
      ['Day', 'Date', 'Location', 'Overnight', 'Activities', 'Meals']
    ];

    dayStructure?.days?.forEach((day: any) => {
      const dayActivities = activities
        ?.filter((a: any) => a.day === day.day)
        .flatMap((a: any) => a.activities || []).length || 0;

      const dayRestaurants = restaurants
        ?.filter((r: any) => r.day === day.day)
        .flatMap((r: any) => r.meals ? Object.keys(r.meals).length : 0)
        .reduce((a: number, b: number) => a + b, 0) || 0;

      overviewData.push([
        day.day,
        day.date,
        day.location,
        day.overnight || '',
        dayActivities,
        dayRestaurants
      ]);
    });

    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

    // Create detailed sheet for each day
    dayStructure?.days?.forEach((day: any) => {
      const sheetData = [
        [`Day ${day.day} - ${day.location}`],
        ['Date', day.date],
        ['Overnight', day.overnight || ''],
        [],
        ['Time', 'Type', 'Name', 'Description', 'Rating', 'Address']
      ];

      // Add activities
      const dayActivities = activities
        ?.filter((a: any) => a.day === day.day)
        .flatMap((a: any) => a.activities || []) || [];

      dayActivities.forEach((activity: any) => {
        sheetData.push([
          '',
          'Activity',
          activity.name,
          activity.description || '',
          activity.rating ? `${activity.rating}/5` : '',
          activity.formatted_address || activity.address || ''
        ]);
      });

      // Add restaurants
      const dayRestaurants = restaurants
        ?.filter((r: any) => r.day === day.day)
        .flatMap((r: any) => {
          if (r.meals) {
            return Object.entries(r.meals).map(([mealType, restaurant]: [string, any]) => ({
              ...restaurant,
              meal: mealType
            }));
          }
          return [];
        }) || [];

      dayRestaurants.forEach((restaurant: any) => {
        sheetData.push([
          restaurant.meal || '',
          'Restaurant',
          restaurant.name,
          restaurant.description || '',
          restaurant.rating ? `${restaurant.rating}/5` : '',
          restaurant.formatted_address || restaurant.address || ''
        ]);
      });

      // Add accommodation
      const accommodation = accommodations?.find((h: any) => h.night === day.day);
      if (accommodation) {
        sheetData.push([
          'Evening',
          'Accommodation',
          accommodation.name,
          accommodation.description || '',
          accommodation.rating ? `${accommodation.rating}/5` : '',
          accommodation.address || ''
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, `Day ${day.day}`);
    });

    // Download
    const fileName = `itinerary-${itinerary.id}-${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(itinerary, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itinerary-${itinerary.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleShowQR = async () => {
    const url = window.location.href;
    try {
      const dataURL = await QRCodeLib.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQRDataURL(dataURL);
      setShowQR(true);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleShareWhatsApp = () => {
    const { dayStructure } = itinerary;
    const text = `Check out this ${dayStructure?.days?.length || 0}-day ${agentType} road trip itinerary! ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setIsOpen(false);
  };

  const handleShareEmail = () => {
    const { dayStructure } = itinerary;
    const subject = `Road Trip Itinerary - ${dayStructure?.days?.length || 0} days`;
    const body = `I wanted to share this amazing ${agentType} road trip itinerary with you!\n\nCheck it out here: ${window.location.href}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Link copied to clipboard!');
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 no-print"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export & Share</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
            <div className="p-2">
              <div className="mb-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Export As
              </div>

              <button
                onClick={handleExportExcel}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Excel Spreadsheet</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FileJson className="h-4 w-4 text-blue-600" />
                <span>JSON Data</span>
              </button>

              <button
                onClick={handleShowQR}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <QrCode className="h-4 w-4 text-purple-600" />
                <span>QR Code</span>
              </button>

              <div className="my-2 border-t border-gray-200"></div>

              <div className="mb-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Share
              </div>

              <button
                onClick={handleShareWhatsApp}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Mail className="h-4 w-4 text-red-600" />
                <span>Email</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 text-blue-600" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Scan QR Code to Share
            </h3>
            <div className="flex justify-center mb-4">
              {qrDataURL && <img src={qrDataURL} alt="QR Code" className="rounded-lg" />}
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">
              Scan this QR code with your phone to share the itinerary
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataURL;
                  a.download = `itinerary-qr-${Date.now()}.png`;
                  a.click();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases } from '@/integrations/appwrite/client';
import { Query } from 'appwrite'; // Import Query from appwrite
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Expanded interfaces to include new data types
interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  revenue: number;
}

interface CountryData {
  id: string;
  name: string;
  userCount: number;
  messageCount: number;
}

interface ServiceData {
  id: string;
  name: string;
  usageCount: number;
  revenue: number;
}

interface OfferData {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiryDate: string;
  isActive: boolean;
}

interface NewsData {
  id: string;
  title: string;
  summary: string;
  date: string;
  imageUrl?: string;
}

// Mock data for when API calls fail
const MOCK_STATS: DashboardData = {
  totalUsers: 12500,
  activeUsers: 8750,
  totalMessages: 125000,
  revenue: 45750.50
};

const MOCK_COUNTRIES: CountryData[] = [
  { id: '1', name: 'United States', userCount: 4500, messageCount: 52000 },
  { id: '2', name: 'United Kingdom', userCount: 3200, messageCount: 38000 },
  { id: '3', name: 'Germany', userCount: 2800, messageCount: 21000 },
  { id: '4', name: 'France', userCount: 1200, messageCount: 9500 },
  { id: '5', name: 'Canada', userCount: 800, messageCount: 4500 }
];

const MOCK_SERVICES: ServiceData[] = [
  { id: '1', name: 'SMS Verification', usageCount: 65400, revenue: 32700.00 },
  { id: '2', name: 'Bulk SMS', usageCount: 43200, revenue: 21600.00 },
  { id: '3', name: 'Automated Alerts', usageCount: 12400, revenue: 6200.00 },
  { id: '4', name: 'Marketing Campaigns', usageCount: 4000, revenue: 7500.50 }
];

const MOCK_OFFERS: OfferData[] = [
  {
    id: '1',
    title: 'Summer Special',
    description: 'Get 20% off on all bulk SMS packages during summer.',
    discount: 20,
    expiryDate: '2025-08-31T00:00:00.000Z',
    isActive: true
  },
  {
    id: '2',
    title: 'New User Bonus',
    description: 'Sign up now and get 100 free SMS credits.',
    discount: 100,
    expiryDate: '2025-12-31T00:00:00.000Z',
    isActive: true
  },
  {
    id: '3',
    title: 'Enterprise Discount',
    description: 'Special pricing for businesses sending over 10,000 messages per month.',
    discount: 15,
    expiryDate: '2025-12-31T00:00:00.000Z',
    isActive: true
  }
];

const MOCK_NEWS: NewsData[] = [
  {
    id: '1',
    title: 'New API Features Released',
    summary: 'We have added new features to our SMS API including delivery reports and scheduled messages.',
    date: '2025-05-15T00:00:00.000Z',
    imageUrl: 'https://placehold.co/600x400/png'
  },
  {
    id: '2',
    title: 'System Maintenance Notice',
    summary: 'We will be performing system maintenance on June 5th from 2AM to 4AM UTC. Service might be intermittently unavailable.',
    date: '2025-06-01T00:00:00.000Z'
  },
  {
    id: '3',
    title: 'Mobile App Launch',
    summary: 'Our new mobile app is now available on iOS and Android app stores. Download today to manage your SMS campaigns on the go.',
    date: '2025-04-10T00:00:00.000Z',
    imageUrl: 'https://placehold.co/600x400/png'
  }
];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    revenue: 0
  });
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [news, setNews] = useState<NewsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch real data
        await fetchStats();
        await fetchCountries();
        await fetchServices();
        await fetchOffersAndNews(); // Combined fetch for offers and news
        setUseMockData(false);
      } catch (error) {
        console.error('Error fetching data from databases:', error);
        // If fetching real data fails, use mock data
        setData(MOCK_STATS);
        setCountries(MOCK_COUNTRIES);
        setServices(MOCK_SERVICES);
        setOffers(MOCK_OFFERS);
        setNews(MOCK_NEWS);
        setUseMockData(true);

        toast({
          title: "Using Demo Data",
          description: "Connected to demo environment with sample data",
          variant: "default",
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch dashboard data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await databases.listDocuments(
        '67f741820018b85a6f1a',
        'stats'
      );

      if (stats.documents && stats.documents.length > 0) {
        const statsData = stats.documents[0];
        setData({
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          totalMessages: statsData.totalMessages || 0,
          revenue: statsData.revenue || 0
        });
      } else {
        // Handle case with no documents
        console.warn("No stats documents found");
        throw new Error("No stats documents found");
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error; // Allow parent function to handle the error
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await databases.listDocuments(
        '67f741820018b85a6f1a',
        'countries',

      );

      if (response.documents && response.documents.length > 0) {
        setCountries(response.documents.map(doc => ({
          id: doc.$id || doc.id,
          name: doc.name || "",
          userCount: doc.userCount || 0,
          messageCount: doc.messageCount || 0
        })));
      } else {
        console.warn("No countries documents found");
        throw new Error("No countries documents found");
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  };

  const fetchServices = async () => {
    try {
      const response = await databases.listDocuments(
        '67f741820018b85a6f1a',
        'services',

      );

      if (response.documents && response.documents.length > 0) {
        setServices(response.documents.map(doc => ({
          id: doc.$id || doc.id,
          name: doc.name || "",
          usageCount: doc.usageCount || 0,
          revenue: doc.revenue || 0
        })));
      } else {
        console.warn("No services documents found");
        throw new Error("No services documents found");
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  };

  // Update the fetchOffersAndNews function

  const fetchOffersAndNews = async () => {
    try {
      // Fetch from the correct database and collection ID for offers_news
      const response = await databases.listDocuments(
        '67f741820018b85a6f1a',  // Database ID
        '67f74190003a8b05be67',   // Collection ID for offers_news

      );

      if (response.documents && response.documents.length > 0) {
        // Log the raw documents to help debug
        console.log('Raw offers/news data:', response.documents);

        // Filter documents into offers and news based on is_offer attribute
        const offersData = response.documents
          .filter(doc => doc.is_offer === true)
          .map(doc => ({
            id: doc.$id || doc.id,
            title: doc.title || "",
            description: doc.description || "",
            discount: doc.discount || 0,
            expiryDate: doc.expiryDate || new Date().toISOString(),
            isActive: doc.isActive || true
          }));

        const newsData = response.documents
          .filter(doc => doc.is_offer !== true)
          .map(doc => ({
            id: doc.$id || doc.id,
            title: doc.title || "",
            summary: doc.summary || doc.description || "",
            date: doc.date || new Date().toISOString(),
            imageUrl: doc.image_url || doc.imageUrl || undefined
          }));

        // Log transformed data
        console.log('Transformed offers:', offersData);
        console.log('Transformed news:', newsData);

        setOffers(offersData);
        setNews(newsData);

        // If we have real data but it's empty, use mock data
        if (offersData.length === 0) {
          setOffers(MOCK_OFFERS);
          console.log('Using mock offers data due to empty results');
        }

        if (newsData.length === 0) {
          setNews(MOCK_NEWS);
          console.log('Using mock news data due to empty results');
        }
      } else {
        console.warn("No offers or news documents found");
        throw new Error("No offers or news documents found");
      }
    } catch (error) {
      console.error('Error fetching offers and news:', error);
      throw error;
    }
  };

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Invalid date";
    }
  };

  // Format currency safely
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "$0.00";
    return `$${value.toFixed(2)}`;
  };

  // Safe render functions to handle potential null data
  const renderCountriesChart = () => {
    if (!countries || countries.length === 0) {
      return <div className="text-center p-4">No country data available</div>;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80">
          <h3 className="text-lg font-medium mb-2">Users by Country</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={countries}
                dataKey="userCount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={(entry) => entry.name}
              >
                {countries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value.toLocaleString()} users`, props?.payload?.name || '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-80">
          <h3 className="text-lg font-medium mb-2">Messages by Country</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} messages`]} />
              <Legend />
              <Bar dataKey="messageCount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderServicesChart = () => {
    if (!services || services.length === 0) {
      return <div className="text-center p-4">No service data available</div>;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80">
          <h3 className="text-lg font-medium mb-2">Service Usage</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={services}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} uses`]} />
              <Legend />
              <Bar dataKey="usageCount" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-80">
          <h3 className="text-lg font-medium mb-2">Service Revenue</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={services}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={(entry) => entry.name}
              >
                {services.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), 'Revenue']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-2">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchAllData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {useMockData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Demo Mode</p>
          <p>Displaying sample data. Database connection not available.</p>
        </div>
      )}

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalUsers.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeUsers.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalMessages.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(data.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard tabs for detailed data */}
      <Tabs defaultValue="countries" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle>Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCountriesChart()}
              {countries.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Countries Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {countries.map((country) => (
                          <tr key={country.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{country.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{country.userCount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{country.messageCount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {renderServicesChart()}
              {services.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Services Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {services.map((service) => (
                          <tr key={service.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{service.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{service.usageCount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(service.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>Current Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <div className="text-center p-4">No offers available</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {offers.map((offer) => (
                    <Card key={offer.id}>
                      <CardHeader>
                        <CardTitle>{offer.title}</CardTitle>
                      </CardHeader>

                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* News Tab */}
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>Latest News</CardTitle>
            </CardHeader>
            <CardContent>
              {news.length === 0 ? (
                <div className="text-center p-4">No news available</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {news.map((newsItem) => (
                    <Card key={newsItem.id}>
                      <CardHeader>
                        <CardTitle>{newsItem.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{newsItem.summary}</p>
                        <p className="text-sm text-gray-500">
                          Published on: {formatDate(newsItem.date)}
                        </p>
                        {newsItem.imageUrl && (
                          <img
                            src={newsItem.imageUrl}
                            alt={newsItem.title}
                            className="mt-2 max-w-full h-auto rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refresh button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

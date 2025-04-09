
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [countriesCount, setCountriesCount] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch counts from each table
        const { count: countriesCount, error: countriesError } = await supabase
          .from('countries')
          .select('*', { count: 'exact', head: true });

        const { count: servicesCount, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });

        const { count: offersCount, error: offersError } = await supabase
          .from('offers_news')
          .select('*', { count: 'exact', head: true });

        if (countriesError) throw countriesError;
        if (servicesError) throw servicesError;
        if (offersError) throw offersError;

        setCountriesCount(countriesCount || 0);
        setServicesCount(servicesCount || 0);
        setOffersCount(offersCount || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [
    { name: 'Countries', value: countriesCount, color: '#2563eb' },
    { name: 'Services', value: servicesCount, color: '#16a34a' },
    { name: 'Offers & News', value: offersCount, color: '#ea580c' },
  ].filter(item => item.value > 0);

  const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : countriesCount}</div>
            <p className="text-xs text-muted-foreground">Countries in the database</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : servicesCount}</div>
            <p className="text-xs text-muted-foreground">Services available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offers & News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : offersCount}</div>
            <p className="text-xs text-muted-foreground">Published offers and news</p>
          </CardContent>
        </Card>
      </div>
      
      {chartData.length > 0 && (
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Data Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

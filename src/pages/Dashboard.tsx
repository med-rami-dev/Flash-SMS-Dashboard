
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

const Dashboard = () => {
  const [stats, setStats] = useState({
    countries: 0,
    services: 0,
    offersNews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Get counts from each table
        const [countriesResult, servicesResult, offersNewsResult] = await Promise.all([
          supabase.from('countries').select('id', { count: 'exact', head: true }),
          supabase.from('services').select('id', { count: 'exact', head: true }),
          supabase.from('offers_news').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          countries: countriesResult.count || 0,
          services: servicesResult.count || 0,
          offersNews: offersNewsResult.count || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Countries</CardTitle>
              <CardDescription>Total managed countries</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.countries}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Services</CardTitle>
              <CardDescription>Total available services</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.services}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Offers & News</CardTitle>
              <CardDescription>Total published content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.offersNews}</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Welcome to your dashboard! Here's how to get started:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the sidebar to navigate between different sections</li>
              <li>
                <strong>Countries</strong>: Manage your country records with ISO codes and pricing
              </li>
              <li>
                <strong>Services</strong>: Add, edit, or remove service offerings
              </li>
              <li>
                <strong>Offers & News</strong>: Publish content and announcements
              </li>
            </ul>
            <p className="mt-4">
              To import data from an Excel file:
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>First, convert your Excel file to CSV format using Excel's "Save As" feature</li>
              <li>Ensure the CSV headers match your table column names</li>
              <li>Use the Supabase dashboard or the import functionality in each section</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

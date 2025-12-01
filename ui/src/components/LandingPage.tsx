import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Leaf, Users, Heart, TrendingDown } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Leaf className="size-16 text-green-600" />
          </div>
          <h1 className="text-6xl mb-6 text-green-800">ireNet</h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connecting food donors with those in need
          </p>
          <p className="text-xl text-gray-500 mb-12 max-w-3xl mx-auto">
            Reduce food waste, fight hunger, and build sustainable communities through our donation matching platform
          </p>
          <Button onClick={onGetStarted} size="lg" className="bg-green-600 hover:bg-green-700">
            Get Started
          </Button>
        </div>

        {/* Problem Statement */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-4 text-center text-gray-800">The Problem We're Solving</h2>
          <p className="text-lg text-gray-600 text-center mb-6">
            Every year, millions of tons of food go to waste while many families struggle with food insecurity. 
            ireNet bridges this gap by connecting donors with organizations serving those in need.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg">
              <TrendingDown className="size-12 text-red-600 mb-3" />
              <p className="text-gray-700">
                <span className="font-semibold">30-40%</span> of food supply is wasted annually
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg">
              <Heart className="size-12 text-orange-600 mb-3" />
              <p className="text-gray-700">
                <span className="font-semibold">1 in 8</span> people face food insecurity
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="size-8 text-green-600" />
              </div>
              <h3 className="text-xl mb-3">Reduce Waste</h3>
              <p className="text-gray-600">
                Donate surplus food instead of throwing it away. Every donation makes a difference.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="size-8 text-blue-600" />
              </div>
              <h3 className="text-xl mb-3">Help Communities</h3>
              <p className="text-gray-600">
                Organizations can request needed items and receive donations from generous donors.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="size-8 text-purple-600" />
              </div>
              <h3 className="text-xl mb-3">Smart Matching</h3>
              <p className="text-gray-600">
                Our platform intelligently matches donations with requests to ensure efficient distribution.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-12 text-white">
          <h2 className="text-3xl mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                1
              </div>
              <h3 className="text-xl mb-2">Sign Up</h3>
              <p>Register as a donor or organization</p>
            </div>
            <div className="text-center">
              <div className="bg-white text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                2
              </div>
              <h3 className="text-xl mb-2">Post or Request</h3>
              <p>Donors list items, organizations request needs</p>
            </div>
            <div className="text-center">
              <div className="bg-white text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                3
              </div>
              <h3 className="text-xl mb-2">Match & Deliver</h3>
              <p>We match donations with requests efficiently</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

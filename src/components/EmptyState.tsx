'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Building2, Users, Wrench, Shield, FileText, 
  Plus, ArrowRight, Sparkles, Home, Key
} from 'lucide-react';

type Role = 'landlord' | 'tenant' | 'contractor';

interface EmptyStateProps {
  role: Role;
}

export function LandlordWelcome() {
  const steps = [
    {
      icon: Building2,
      title: 'Add your first property',
      description: 'Start by adding a property to manage',
      href: '/properties/new',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Users,
      title: 'Invite tenants',
      description: 'Send invites to your tenants',
      href: '/invite',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Add compliance certificates',
      description: 'Track Gas Safety, EICR, EPC dates',
      href: '/compliance',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Hero */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#E8998D] to-[#F4A261] flex items-center justify-center shadow-lg"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Welcome to LetLog! 🎉
        </h1>
        <p className="text-lg text-slate-600 max-w-md mx-auto">
          Let's get your property portfolio set up. Follow these steps to get started.
        </p>
      </div>

      {/* Getting Started Steps */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Link href={step.href}>
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group bg-white/70 backdrop-blur hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {step.description}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-sm font-medium text-[#E8998D] group-hover:gap-2 transition-all">
                    Get started <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">
                💡 Pro tip
              </h4>
              <p className="text-sm text-slate-600">
                Upload your compliance certificates (Gas Safety, EICR, EPC) and LetLog will automatically remind you before they expire. Never miss a renewal again!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function TenantWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
      >
        <Home className="w-10 h-10 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold text-slate-800 mb-3">
        Welcome, Tenant! 🏠
      </h1>
      <p className="text-lg text-slate-600 max-w-md mx-auto mb-8">
        Your landlord will send you an invite to connect your tenancy. Once connected, you'll be able to:
      </p>
      
      <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
        {[
          { icon: Wrench, text: 'Report maintenance issues' },
          { icon: FileText, text: 'Access your tenancy documents' },
          { icon: Shield, text: 'View compliance certificates' },
          { icon: Key, text: 'Document property condition' },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-white shadow"
          >
            <item.icon className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-700">{item.text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ContractorWelcome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg"
      >
        <Wrench className="w-10 h-10 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold text-slate-800 mb-3">
        Welcome, Contractor! 🔧
      </h1>
      <p className="text-lg text-slate-600 max-w-md mx-auto mb-8">
        Find jobs from landlords in your area and grow your business.
      </p>
      
      <Link href="/tenders">
        <Button size="lg" className="gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
          Browse Available Jobs
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}

export function DashboardEmptyState({ role }: EmptyStateProps) {
  switch (role) {
    case 'landlord':
      return <LandlordWelcome />;
    case 'tenant':
      return <TenantWelcome />;
    case 'contractor':
      return <ContractorWelcome />;
    default:
      return <LandlordWelcome />;
  }
}

export default DashboardEmptyState;

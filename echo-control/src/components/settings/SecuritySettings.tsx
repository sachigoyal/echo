'use client';

import React from 'react';
import { Key } from 'lucide-react';
import OAuthConfigSection from '../OAuthConfigSection';

interface SecuritySettingsProps {
  appId: string;
}

export default function SecuritySettings({ appId }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure security settings and access controls for your app
        </p>
      </div>

      {/* OAuth Configuration */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center mb-4">
          <Key className="h-5 w-5 mr-2 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">
            OAuth Configuration
          </h4>
        </div>

        <OAuthConfigSection appId={appId} />
      </div>
    </div>
  );
}

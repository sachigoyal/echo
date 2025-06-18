'use client';

import { useState, useEffect } from 'react';
import { CheckIcon } from 'lucide-react';
import { GlassButton } from './glass-button';

interface MarkupSettingsCardProps {
  appId: string;
  appName: string;
}

export default function MarkupSettingsCard({ appId }: MarkupSettingsCardProps) {
  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert multiplier to percentage
  const multiplierToPercentage = (multiplier: number): number => {
    return Math.max(0, (multiplier - 1) * 100);
  };

  // Convert percentage to multiplier
  const percentageToMultiplier = (percentage: number): number => {
    return percentage / 100 + 1;
  };

  // Fetch current markup value
  useEffect(() => {
    const fetchMarkup = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/apps/${appId}/owner-details`);
        const data = await response.json();

        if (response.ok && data.markup !== undefined) {
          const multiplier = Number(data.markup);
          const percentage = multiplierToPercentage(multiplier);

          setMarkupPercentage(percentage);
          setInputValue(percentage.toString());
        }
      } catch (error) {
        console.error('Error fetching markup:', error);
        setError('Failed to load current markup');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkup();
  }, [appId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const newPercentage = parseFloat(inputValue);

      if (isNaN(newPercentage) || newPercentage < 0) {
        setError('Markup must be 0% or higher');
        return;
      }

      if (newPercentage > 1000) {
        setError('Markup cannot exceed 1000%');
        return;
      }

      const newMultiplier = percentageToMultiplier(newPercentage);

      const response = await fetch(`/api/apps/${appId}/owner-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markup: newMultiplier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update markup');
      }

      setMarkupPercentage(newPercentage);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating markup:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update markup'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);
  };

  const currentPercentage = parseFloat(inputValue) || 0;
  const isChanged = currentPercentage !== markupPercentage;

  // Calculate example costs for $10 base cost
  const baseCost = 10;
  const newTotalCost = baseCost * percentageToMultiplier(currentPercentage);

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Markup Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set a percentage markup on top of base token costs. For example, a
            50% markup means customers pay $15 for every $10 in base costs.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {markupPercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Current Rate</div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Markup Percentage</label>

          {/* Input */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="1000"
                step="1"
                value={inputValue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md text-center bg-background"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>

            <GlassButton
              onClick={handleSave}
              disabled={saving || !isChanged}
              variant="secondary"
            >
              {saving ? (
                'Saving...'
              ) : success ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Saved
                </>
              ) : (
                'Save'
              )}
            </GlassButton>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Live Preview</h4>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Markup:</span>
                <span className="font-bold text-lg">
                  {currentPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  $10.00 base:
                </span>
                <span className="font-semibold">
                  ${newTotalCost.toFixed(2)}
                </span>
              </div>

              {currentPercentage === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-3">
                  <div className="text-xs text-amber-800">
                    <span className="font-medium">⚠️ No profit margin:</span> 0%
                    markup means no profit.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckIcon className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-700">
              Markup updated successfully! New rate:{' '}
              {markupPercentage.toFixed(0)}% markup
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

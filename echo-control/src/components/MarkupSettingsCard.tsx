'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, DollarSignIcon } from 'lucide-react';
import { GlassButton } from './glass-button';
import {
  formatPercentage,
  multiplierToPercentage,
  percentageToMultiplier,
  safeParseFloat,
  arePercentagesEqual,
  validatePercentage,
} from '@/lib/utils/decimal';

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

      const validation = validatePercentage(inputValue);

      if (!validation.isValid || validation.value === undefined) {
        setError(validation.error || 'Invalid input');
        return;
      }

      const newMultiplier = percentageToMultiplier(validation.value);

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

      setMarkupPercentage(validation.value);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
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
    setSuccess(false);
  };

  const currentPercentage = safeParseFloat(inputValue);
  const isChanged = !arePercentagesEqual(currentPercentage, markupPercentage);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DollarSignIcon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Markup Settings</h3>
            <p className="text-sm text-muted-foreground">
              This is the premium applied to the token costs you will receive.
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {formatPercentage(markupPercentage)}
          </div>
          <div className="text-xs text-muted-foreground">Current</div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              max="1000"
              step="1"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-input bg-background text-foreground rounded-lg text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">
              %
            </span>
          </div>
          <GlassButton
            onClick={handleSave}
            disabled={
              saving || !isChanged || !validatePercentage(inputValue).isValid
            }
            variant={
              success
                ? 'secondary'
                : isChanged && validatePercentage(inputValue).isValid
                  ? 'primary'
                  : 'secondary'
            }
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                Saving
              </div>
            ) : success ? (
              <div className="flex items-center ">
                <CheckIcon className="h-4 w-4 mr-2" />
                Saved
              </div>
            ) : (
              'Save'
            )}
          </GlassButton>
        </div>

        {/* Quick Presets */}
        <div className="flex space-x-2">
          {[0, 25, 50, 100].map(preset => (
            <button
              key={preset}
              onClick={() => setInputValue(preset.toString())}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPercentage === preset
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

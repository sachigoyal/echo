'use client';

import { useState, useEffect } from 'react';
import { DollarSignIcon, SettingsIcon, CheckIcon } from 'lucide-react';

interface MarkupSettingsCardProps {
  appId: string;
  appName: string;
}

export default function MarkupSettingsCard({ appId }: MarkupSettingsCardProps) {
  const [markup, setMarkup] = useState<number>(0);
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
          setMarkup(Number(data.markup));
          setInputValue(Number(data.markup).toString());
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

      const newMarkup = parseFloat(inputValue);

      if (isNaN(newMarkup) || newMarkup <= 0) {
        setError('Markup must be a positive number');
        return;
      }

      const response = await fetch(`/api/apps/${appId}/owner-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markup: newMarkup }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update markup');
      }

      setMarkup(newMarkup);
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
    setInputValue(e.target.value);
    setError(null);
  };

  const isChanged = parseFloat(inputValue) !== markup;

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center mb-4">
        <SettingsIcon className="h-5 w-5 text-muted-foreground mr-2" />
        <h3 className="text-lg font-semibold text-foreground">Token Markup</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Set the markup multiplier for token costs charged to your customers.
            This allows you to add a margin on top of the base token costs.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
            <p className="text-sm text-blue-700">
              If you set a markup of 1.2, customers will be charged 20% more
              than the base token cost. A markup of 1.0 means no additional
              charge (pass-through pricing).
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="markup-input"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Markup Multiplier
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="markup-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-input bg-input text-input-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="1.0"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !isChanged}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                    success
                      ? 'bg-green-500 text-white'
                      : isChanged && !saving
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : success ? (
                    <div className="flex items-center">
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Saved!
                    </div>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>

            {/* Current vs New Preview */}
            {isChanged && (
              <div className="bg-accent/50 rounded-lg p-3">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-muted-foreground">
                      Current markup:
                    </span>
                    <span className="font-medium">{markup.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">New markup:</span>
                    <span className="font-medium text-primary">
                      {parseFloat(inputValue || '0').toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/20 border border-destructive rounded-md p-3">
            <div className="text-sm text-destructive-foreground">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-green-700">
              Markup updated successfully! New rate: {markup.toFixed(2)}x
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

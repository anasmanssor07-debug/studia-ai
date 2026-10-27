import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Sparkles, User, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  {
    id: 'studia-logo',
    title: 'Logo Officiel STUDIA AI',
    url: '/assets/aistudio/logo_studia_ai_a2b1aae5.png',
    badge: 'Officiel',
  },
  {
    id: 'student-ing',
    title: 'Génie & Ingénierie',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    badge: 'Ingénieur',
  },
  {
    id: 'student-tech',
    title: 'Informatique & Code',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    badge: 'Tech',
  },
  {
    id: 'student-med',
    title: 'Médecine & Santé',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
    badge: 'Santé',
  },
  {
    id: 'student-business',
    title: 'Business & Management',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    badge: 'Business',
  },
  {
    id: 'student-math',
    title: 'Maths & Sciences',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    badge: 'Sciences',
  },
  {
    id: 'student-law',
    title: 'Droit & Lettres',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    badge: 'Droit',
  },
  {
    id: 'student-scholar',
    title: 'Étudiant Lauréat',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    badge: 'Lauréat',
  },
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    user?.avatarUrl || '/assets/aistudio/logo_studia_ai_a2b1aae5.png'
  );
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Veuillez sélectionner une image de moins de 5 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCustomPreview(result);
        setSelectedAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ avatarUrl: selectedAvatar });
      onClose();
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour de la photo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Photo de profil & Avatar</h3>
              <p className="text-xs text-slate-500">Personnalisez votre apparence sur STUDIA AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5 overflow-y-auto flex-1">
          {/* Active Preview */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md shrink-0 bg-slate-200">
              <img
                src={selectedAvatar}
                alt="Aperçu"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/logo_studia_ai_a2b1aae5.png';
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Aperçu sélectionné</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cette image apparaîtra dans votre en-tête, votre profil et vos interactions d'apprentissage.
              </p>
            </div>
          </div>

          {/* Upload from Device Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Téléverser depuis votre appareil
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Choisir une photo depuis votre appareil (JPG, PNG, WebP)</span>
            </button>
          </div>

          {/* Example Avatars */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              2. Ou choisir parmi nos avatars étudiants
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.url;
                return (
                  <div
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.url);
                      setCustomPreview(null);
                    }}
                    className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 mb-1.5 shrink-0 border border-slate-200">
                      <img
                        src={avatar.url}
                        alt={avatar.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 line-clamp-1">{avatar.badge}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Valider la photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

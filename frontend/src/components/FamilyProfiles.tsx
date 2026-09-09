import React, { useState } from 'react';
import { FamilyMember } from '../types';
import { Users, Plus, Trash2, Edit2, Flame, ShieldCheck, Sparkles, AlertCircle, Ban } from 'lucide-react';

interface Props {
  members: FamilyMember[];
  onSaveMember: (member: Partial<FamilyMember>) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
}

const COMMON_ALLERGIES = ['Laktose', 'Gluten', 'Nuesse', 'Eier', 'Fisch', 'Soja'];
const COMMON_DISLIKED = ['Brokkoli', 'Champignons', 'Zucchini', 'Tomaten', 'Lachs', 'Rindfleisch', 'Zwiebeln', 'Spinat'];

export const FamilyProfiles: React.FC<Props> = ({ members, onSaveMember, onDeleteMember }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customDislikeInput, setCustomDislikeInput] = useState('');
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    gender: 'male',
    age: 30,
    height_cm: 180,
    weight_kg: 78,
    activity_level: 'moderate',
    goal: 'maintain',
    dietary_preference: 'all',
    allergies: [],
    disliked_foods: [],
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      gender: 'male',
      age: 30,
      height_cm: 180,
      weight_kg: 78,
      activity_level: 'moderate',
      goal: 'maintain',
      dietary_preference: 'all',
      allergies: [],
      disliked_foods: [],
    });
    setCustomDislikeInput('');
    setIsEditing(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setFormData({
      ...member,
      allergies: member.allergies || [],
      disliked_foods: member.disliked_foods || [],
    });
    setCustomDislikeInput('');
    setIsEditing(true);
  };

  const toggleAllergy = (allergy: string) => {
    const norm = allergy.toLowerCase();
    const current = formData.allergies || [];
    if (current.includes(norm)) {
      setFormData({ ...formData, allergies: current.filter((a) => a !== norm) });
    } else {
      setFormData({ ...formData, allergies: [...current, norm] });
    }
  };

  const toggleDisliked = (food: string) => {
    const norm = food.toLowerCase();
    const current = formData.disliked_foods || [];
    if (current.includes(norm)) {
      setFormData({ ...formData, disliked_foods: current.filter((f) => f !== norm) });
    } else {
      setFormData({ ...formData, disliked_foods: [...current, norm] });
    }
  };

  const handleAddCustomDislike = () => {
    if (!customDislikeInput.trim()) return;
    const norm = customDislikeInput.trim().toLowerCase();
    const current = formData.disliked_foods || [];
    if (!current.includes(norm)) {
      setFormData({ ...formData, disliked_foods: [...current, norm] });
    }
    setCustomDislikeInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    await onSaveMember(formData);
    setIsEditing(false);
  };

  const previewBmr = Math.round(
    10 * (formData.weight_kg || 75) +
    6.25 * (formData.height_cm || 180) -
    5 * (formData.age || 30) +
    (formData.gender === 'male' ? 5 : -161)
  );
  const pal = formData.activity_level === 'sedentary' ? 1.2 :
              formData.activity_level === 'light' ? 1.375 :
              formData.activity_level === 'moderate' ? 1.55 :
              formData.activity_level === 'active' ? 1.725 : 1.9;
  const previewTdee = Math.round(previewBmr * pal);
  const previewTarget = Math.round(
    formData.goal === 'lose_weight' ? previewTdee * 0.8 :
    formData.goal === 'gain_muscle' ? previewTdee * 1.1 : previewTdee
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Familien-Profile & Vorlieben</h2>
          </div>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
            Hinterlege für jede Person individuelle Körperdaten, Ernährungsformen (z. B. vegetarisch, pescetarisch), Allergien und ungeliebte Zutaten. Die Rezepte und Portionsgrößen werden vollautomatisch angepasst.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-white text-emerald-800 font-bold px-5 py-2.5 rounded-2xl shadow hover:bg-emerald-50 transition transform active:scale-95 text-xs sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Mitglied hinzufügen
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => {
          const isDeficit = member.goal === 'lose_weight';
          const isSurplus = member.goal === 'gain_muscle';

          return (
            <div
              key={member.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition relative flex flex-col justify-between"
            >
              <div>
                {/* Member Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm ${
                      member.gender === 'male' ? 'bg-blue-600' : 'bg-rose-500'
                    }`}>
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
                      <span className="text-xs text-slate-500 font-medium">
                        {member.gender === 'male' ? 'Männlich' : 'Weiblich'}, {member.age} J. • {member.height_cm} cm / {member.weight_kg} kg
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {members.length > 1 && (
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    isDeficit ? 'bg-amber-100 text-amber-800' :
                    isSurplus ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {member.goal === 'lose_weight' ? '🎯 Fettabbau (-20%)' :
                     member.goal === 'gain_muscle' ? '💪 Muskelaufbau (+10%)' : '⚖️ Gewicht halten'}
                  </span>

                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {member.dietary_preference === 'vegetarian' ? '🌱 Vegetarisch' :
                     member.dietary_preference === 'vegan' ? '🌿 Vegan' :
                     member.dietary_preference === 'pescetarian' ? '🐟 Pescetarisch' :
                     member.dietary_preference === 'no_pork' ? '🚫 Kein Schwein' : '🥩 Allesesser'}
                  </span>
                </div>

                {/* Allergies & Dislikes Pills */}
                {((member.allergies && member.allergies.length > 0) || (member.disliked_foods && member.disliked_foods.length > 0)) && (
                  <div className="mb-4 space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    {member.allergies && member.allergies.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-rose-700 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Allergien:
                        </span>
                        {member.allergies.map((a, idx) => (
                          <span key={idx} className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold text-[11px] capitalize">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {member.disliked_foods && member.disliked_foods.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-slate-500" /> Mag nicht:
                        </span>
                        {member.disliked_foods.map((f, idx) => (
                          <span key={idx} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px] capitalize">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Calorie Dial Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" /> Tagesziel
                    </span>
                    <span className="text-xl font-extrabold text-slate-900">
                      {member.target_calories} <span className="text-xs font-normal text-slate-500">kcal/Tag</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                    <div>Grundumsatz: <span className="font-semibold text-slate-700">{Math.round(member.bmr)} kcal</span></div>
                    <div>Leistungsumsatz: <span className="font-semibold text-slate-700">{Math.round(member.tdee)} kcal</span></div>
                  </div>
                </div>

                {/* Macros Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-2.5">
                    <span className="block text-[11px] font-semibold text-emerald-700">Protein</span>
                    <span className="text-base font-bold text-emerald-900">{member.target_protein_g}g</span>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-2.5">
                    <span className="block text-[11px] font-semibold text-blue-700">Carbs</span>
                    <span className="text-base font-bold text-blue-900">{member.target_carbs_g}g</span>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-2.5">
                    <span className="block text-[11px] font-semibold text-amber-700">Fett</span>
                    <span className="text-base font-bold text-amber-900">{member.target_fat_g}g</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Gesunde Lebensmittel
                </span>
                <span>Mifflin-St Jeor</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-bold text-slate-900">
                {formData.id ? 'Profil bearbeiten' : 'Neues Familienmitglied'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Dennis, Sarah, Lukas"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Geschlecht</label>
                  <select
                    value={formData.gender || 'male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Alter (Jahre)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age || 30}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Körpergröße (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={formData.height_cm || 180}
                    onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gewicht (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    max="250"
                    value={formData.weight_kg || 75}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ernährungsform</label>
                <select
                  value={formData.dietary_preference || 'all'}
                  onChange={(e) => setFormData({ ...formData, dietary_preference: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                >
                  <option value="all">Allesesser (Omnivor - Fleisch, Fisch, Gemüse)</option>
                  <option value="no_pork">Kein Schweinefleisch (nur Geflügel/Rind/Fisch)</option>
                  <option value="pescetarian">Pescetarisch (Fisch & Pflanzen, kein Fleisch)</option>
                  <option value="vegetarian">Vegetarisch (kein Fleisch & Fisch, mit Eiern/Milch)</option>
                  <option value="vegan">Vegan (rein pflanzlich)</option>
                </select>
              </div>

              {/* Allergies Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Allergien & Unverträglichkeiten
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const norm = allergy.toLowerCase();
                    const isSelected = (formData.allergies || []).includes(norm);
                    return (
                      <button
                        type="button"
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{allergy}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disliked Foods Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                  Mag ich nicht (Ausschlüsse)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_DISLIKED.map((food) => {
                    const norm = food.toLowerCase();
                    const isSelected = (formData.disliked_foods || []).includes(norm);
                    return (
                      <button
                        type="button"
                        key={food}
                        onClick={() => toggleDisliked(food)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✕ ' : ''}{food}
                      </button>
                    );
                  })}
                </div>

                {/* Custom dislike input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Weiteres Lebensmittel ausschließen..."
                    value={customDislikeInput}
                    onChange={(e) => setCustomDislikeInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDislike}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    + Hinzufügen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Aktivitätslevel</label>
                <select
                  value={formData.activity_level || 'moderate'}
                  onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="sedentary">Sitzend (reine Büroarbeit, kaum Bewegung)</option>
                  <option value="light">Leicht aktiv (Gelegenheitsspaziergänge)</option>
                  <option value="moderate">Moderat aktiv (1-3x Sport/Woche oder stehende Arbeit)</option>
                  <option value="active">Sehr aktiv (4-5x Sport/Woche oder körperliche Arbeit)</option>
                  <option value="very_active">Extrem aktiv (Leistungssportler / Bau)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ziel</label>
                <select
                  value={formData.goal || 'maintain'}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="lose_weight">Fettabbau / Defizit (-20% Kalorien, hoher Proteinanteil)</option>
                  <option value="maintain">Gewicht halten (Energiebilanz ausgeglichen)</option>
                  <option value="gain_muscle">Muskelaufbau / Überschuss (+10% Kalorien, Kraftzuwachs)</option>
                </select>
              </div>

              {/* Live Preview Box */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-xs text-emerald-700 font-semibold block">Errechnetes Tagesziel:</span>
                  <span className="text-2xl font-black text-emerald-900">{previewTarget} kcal</span>
                </div>
                <div className="text-right text-xs text-emerald-700 space-y-0.5">
                  <div>Grundumsatz: ~{previewBmr} kcal</div>
                  <div>TDEE: ~{previewTdee} kcal</div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition text-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

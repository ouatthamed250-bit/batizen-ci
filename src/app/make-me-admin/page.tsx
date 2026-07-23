'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseServices } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';

/**
 * Page de backdoor admin : permet à un utilisateur connecté (client)
 * de devenir admin en saisissant un code secret.
 *
 * ⚠️ Code secret en dur ici uniquement pour le développement.
 * En production, utilisez une Cloud Function ou un secret côté serveur.
 */
const ADMIN_SECRET_CODE = 'batizen2022';

export default function MakeMeAdminPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);

    // Vérification : utilisateur connecté
    if (!user) {
      setMessage('❌ Vous devez être connecté pour utiliser cette page.');
      return;
    }

    // Vérification : code secret
    if (code !== ADMIN_SECRET_CODE) {
      setMessage('❌ Code secret incorrect.');
      return;
    }

    setLoading(true);

    try {
      const { db } = getFirebaseServices();
      const userRef = ref(db, `users/${user.uid}`);

      // Lire les données existantes de l'utilisateur
      const snapshot = await get(userRef);
      const existingData = snapshot.exists() ? snapshot.val() : {};

      // Mettre à jour le rôle admin dans la Realtime Database
      await set(userRef, {
        ...existingData,
        uid: user.uid,
        email: user.email || existingData.email,
        displayName: user.displayName || existingData.displayName || '',
        role: 'admin',
        updatedAt: new Date().toISOString(),
      });

      setMessage('✅ Tu es maintenant admin ! Déconnecte-toi et reconnecte-toi.');
      setSuccess(true);
    } catch (error: any) {
      setMessage(`❌ Erreur : ${error.message || 'Une erreur est survenue.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full space-y-6">

        {/* Titre */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold">Backdoor Admin</h1>
          <p className="text-sm text-gray-400">
            Saisissez le code secret pour activer les droits administrateur.
          </p>
        </div>

        {/* État non connecté */}
        {!user ? (
          <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 text-sm text-center">
            ⚠️ Vous devez d'abord vous connecter pour accéder à cette page.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Code secret
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Entrez le code secret"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Activation...
                </span>
              ) : (
                'Devenir Admin'
              )}
            </button>
          </form>
        )}

        {/* Message de résultat */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm font-semibold text-center ${
              success
                ? 'bg-green-900/40 border border-green-600/50 text-green-300'
                : 'bg-red-900/40 border border-red-600/50 text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 text-sm text-gray-400 hover:text-white transition font-medium"
          >
            ← Retour à l'accueil
          </button>

          {success && (
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Aller au Dashboard Admin →
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
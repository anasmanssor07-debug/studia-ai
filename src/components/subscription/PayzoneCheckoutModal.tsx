import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Smartphone, 
  Sparkles, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface PayzoneCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type CheckoutStep = 'card_input' | 'three_d_secure' | 'success' | 'failure';

export const PayzoneCheckoutModal: React.FC<PayzoneCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<CheckoutStep>('card_input');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payzone Order Info
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amount: string;
    currencyCode: string;
    signature: string;
    timestamp: string;
  } | null>(null);

  // Form Fields
  const [cardNumber, setCardNumber] = useState<string>('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState<string>(user?.name || 'Étudiant Marocain');
  const [expiry, setExpiry] = useState<string>('12/28');
  const [cvv, setCvv] = useState<string>('123');
  const [otpCode, setOtpCode] = useState<string>('123456');

  // Success Transaction Details
  const [completedTx, setCompletedTx] = useState<any>(null);

  if (!isOpen) return null;

  // Format Card Number with Spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  // Step 1: Initiate Payzone Order & proceed to 3D Secure
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const initRes = await api.initiatePayzonePayment();
      setOrderData(initRes);
      // Proceed to Moroccan 3D Secure simulation step
      setStep('three_d_secure');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’initialiser le paiement sécurisé Payzone.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate 3D Secure OTP & trigger server-to-server webhook
  const handleConfirmOtp = async (shouldApprove = true) => {
    if (!orderData) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
      const simRes = await api.simulatePayzonePayment({
        orderId: orderData.orderId,
        cardBrand: 'CMI / Visa Maroc',
        last4,
        shouldApprove,
        otp: otpCode,
      });

      if (simRes.status === 'SUCCESS') {
        setCompletedTx({
          orderId: orderData.orderId,
          amount: '40.00',
          currency: 'MAD',
          date: new Date().toLocaleDateString('fr-FR'),
          authCode: 'AUTH-' + Math.floor(Math.random() * 899999 + 100000),
          nextRenewal: new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('fr-FR'),
        });
        await refreshUser();
        setStep('success');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(simRes.message || 'La transaction a été refusée par la banque.');
        setStep('failure');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la validation bancaire.');
      setStep('failure');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('card_input');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col">
        {/* Top Header with Payzone & Moroccan Banking Branding */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wider uppercase border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Payzone Maroc • 3D Secure
            </span>
            <span className="text-xs text-blue-300 font-semibold">
              Paiement 100% Chiffré SHA-512
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            Abonnement STUDIA AI Premium
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400">40 MAD</span>
            <span className="text-xs text-slate-300">/ mois (soit 40 DH TTC, sans engagement)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: CARD DETAILS FORM */}
          {step === 'card_input' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              {/* Moroccan Payment Summary */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-600 font-medium">Formule :</span>{' '}
                  <span className="font-bold text-slate-900">STUDIA AI Premium (1 mois)</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Accès illimité aux résumés PDF, quiz et assistant IA
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-blue-700">40 DH</span>
                  <div className="text-[10px] text-emerald-600 font-semibold">TTC en Dirhams</div>
                </div>
              </div>

              {/* Supported Moroccan Cards */}
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
                <span>Cartes marocaines acceptées :</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[10px]">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">CMI</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">VISA</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">MASTERCARD</span>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet du titulaire de la carte
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="ex. Anas Manssor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de carte bancaire (Maroc ou International)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all tracking-wider"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/AA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-semibold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Cryptogramme (CVV)</span>
                    <span className="text-[10px] text-slate-400">3 chiffres</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="•••"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-semibold text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Security info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Vos données bancaires transitent de manière sécurisée directement vers la passerelle Payzone Maroc. Aucune coordonnée bancaire n'est stockée en clair sur nos serveurs.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sécurisation de la commande Payzone...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Payer 40 MAD en toute sécurité</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 3D SECURE MAROCAIN (SMS OTP) */}
          {step === 'three_d_secure' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
                <Smartphone className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Authentification 3D Secure requise
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Votre banque marocaine a envoyé un code de confirmation par SMS sur votre mobile associé à votre compte bancaire.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-sm mx-auto space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Commerçant :</span>
                  <span className="font-bold">STUDIA AI (Payzone Maroc)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant :</span>
                  <span className="font-extrabold text-blue-700">40.00 MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Numéro de commande :</span>
                  <span className="font-mono text-[11px]">{orderData?.orderId}</span>
                </div>
              </div>

              {/* OTP Input */}
              <div className="max-w-xs mx-auto">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Code de vérification SMS (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-xl font-mono font-black tracking-widest px-4 py-2.5 rounded-xl border-2 border-blue-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  En environnement de simulation test, saisissez le code <strong className="text-blue-600">123456</strong>.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 max-w-sm mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmOtp(true)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Vérification auprès de la banque...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer et valider le paiement (40 MAD)</span>
                    </>
                  )}
                </button>

                {/* Simulate Decline Button for QA testing */}
                <button
                  type="button"
                  onClick={() => handleConfirmOtp(false)}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Simuler un refus bancaire (Test QA)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS VIEW */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
                  Paiement Confirmé avec Succès
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Félicitations, vous êtes Premium !
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Votre abonnement mensuel de 40 MAD a été activé. Vous bénéficiez désormais de l'accès illimité à tous les outils d'apprentissage intelligents.
                </p>
              </div>

              {/* Receipt Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 text-left max-w-md mx-auto space-y-1.5 font-medium">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Transaction Payzone :</span>
                  <span className="font-mono font-bold text-slate-900">{completedTx?.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant réglé :</span>
                  <span className="font-bold text-emerald-700">40.00 MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Code d'autorisation CMI :</span>
                  <span className="font-mono">{completedTx?.authCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Période payée active jusqu'au :</span>
                  <span className="font-bold text-slate-900">{completedTx?.nextRenewal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-md mx-auto py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer block"
              >
                Accéder immédiatement à mes cours et à l'IA
              </button>
            </div>
          )}

          {/* STEP 4: FAILURE VIEW */}
          {step === 'failure' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                <AlertCircle className="w-9 h-9" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider">
                  Paiement Refusé
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  La transaction n'a pas pu aboutir
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Le centre d'autorisation bancaire a décliné le paiement de 40 MAD. Vérifiez le solde de votre compte ou essayez une autre carte marocaine.
                </p>
              </div>

              <div className="flex gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Réessayer avec une carte
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Guarantee & SSL */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sécurité bancaire conforme aux normes PCI-DSS & CMI Maroc. Résiliable en 1 clic.</span>
        </div>
      </div>
    </div>
  );
};

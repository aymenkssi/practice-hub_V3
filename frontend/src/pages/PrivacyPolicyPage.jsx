import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { Footer } from '../components/Footer';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function PrivacyPolicyPage() {
  const { lang, t } = useLang();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="privacy-page">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MockExamCenter</span>
          </Link>
          <LangSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-8 w-full">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {lang === 'fr' ? 'Accueil' : 'Home'}
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t('privacy.title')}</h1>
        <p className="text-gray-500 mb-8">{t('privacy.lastUpdate')} : 15 mars 2026</p>

        {lang === 'fr' ? <PrivacyFR /> : <PrivacyEN />}
      </main>
      <Footer />
    </div>
  );
}

function PrivacyFR() {
  return (
    <div className="prose prose-gray max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">1. Responsable du traitement</h2>
        <p>MockExamCenter est responsable du traitement des données personnelles collectées via cette plateforme.</p>
        <p>Pour toute question relative à vos données, contactez-nous à : <strong>contact@mockexamcenter.com</strong></p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Données collectées</h2>
        <p>Nous collectons les données suivantes :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Données d'inscription :</strong> nom, adresse email, mot de passe (haché)</li>
          <li><strong>Données d'utilisation :</strong> résultats d'examens, scores, tentatives, progression</li>
          <li><strong>Données de paiement :</strong> historique des commandes, identifiants PayPal (nous ne stockons pas vos données de carte bancaire)</li>
          <li><strong>Données techniques :</strong> cookies essentiels pour le fonctionnement du site</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Finalités du traitement</h2>
        <p>Vos données sont traitées pour :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>La gestion de votre compte utilisateur</li>
          <li>L'accès aux examens et le suivi de votre progression</li>
          <li>Le traitement des paiements via PayPal</li>
          <li>L'amélioration de nos services</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Base légale</h2>
        <p>Le traitement de vos données repose sur :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>L'exécution du contrat :</strong> pour fournir les services d'examen</li>
          <li><strong>Votre consentement :</strong> donné lors de l'inscription</li>
          <li><strong>L'intérêt légitime :</strong> pour améliorer nos services</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Durée de conservation</h2>
        <p>Vos données sont conservées pendant la durée de votre compte. En cas de suppression de votre compte, toutes vos données seront supprimées dans un délai de 30 jours.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Partage des données</h2>
        <p>Vos données ne sont partagées avec aucun tiers, à l'exception de :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>PayPal :</strong> pour le traitement des paiements</li>
          <li><strong>Obligations légales :</strong> si requis par la loi</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Vos droits (RGPD)</h2>
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Droit de rectification :</strong> modifier vos données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> supprimer votre compte et vos données</li>
          <li><strong>Droit à la portabilité :</strong> exporter vos données au format JSON</li>
          <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
          <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
        </ul>
        <p className="mt-2">Vous pouvez exercer ces droits depuis votre profil (export et suppression de données) ou en nous contactant à <strong>contact@mockexamcenter.com</strong>.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Cookies</h2>
        <p>Nous utilisons uniquement des cookies essentiels nécessaires au fonctionnement du site :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Token d'authentification :</strong> pour maintenir votre session</li>
          <li><strong>Préférence de langue :</strong> pour mémoriser votre choix de langue</li>
          <li><strong>Consentement cookies :</strong> pour mémoriser votre choix</li>
        </ul>
        <p>Aucun cookie de suivi ou publicitaire n'est utilisé.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Sécurité</h2>
        <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données, notamment le chiffrement des mots de passe et les connexions sécurisées (HTTPS).</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Réclamation</h2>
        <p>Si vous estimez que le traitement de vos données n'est pas conforme au RGPD, vous pouvez déposer une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a></p>
      </section>
    </div>
  );
}

function PrivacyEN() {
  return (
    <div className="prose prose-gray max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">1. Data Controller</h2>
        <p>MockExamCenter is the data controller for personal data collected through this platform.</p>
        <p>For any questions about your data, contact us at: <strong>contact@mockexamcenter.com</strong></p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Data Collected</h2>
        <p>We collect the following data:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Registration data:</strong> name, email address, password (hashed)</li>
          <li><strong>Usage data:</strong> exam results, scores, attempts, progress</li>
          <li><strong>Payment data:</strong> order history, PayPal identifiers (we do not store your credit card data)</li>
          <li><strong>Technical data:</strong> essential cookies for site operation</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Processing Purposes</h2>
        <p>Your data is processed for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Managing your user account</li>
          <li>Providing access to exams and tracking your progress</li>
          <li>Processing payments through PayPal</li>
          <li>Improving our services</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Legal Basis</h2>
        <p>The processing of your data is based on:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Contract performance:</strong> to provide exam services</li>
          <li><strong>Your consent:</strong> given during registration</li>
          <li><strong>Legitimate interest:</strong> to improve our services</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Data Retention</h2>
        <p>Your data is retained for the duration of your account. If you delete your account, all your data will be removed within 30 days.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Data Sharing</h2>
        <p>Your data is not shared with any third parties, except for:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>PayPal:</strong> for payment processing</li>
          <li><strong>Legal obligations:</strong> if required by law</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Your Rights (GDPR)</h2>
        <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Right of access:</strong> obtain a copy of your data</li>
          <li><strong>Right to rectification:</strong> correct inaccurate data</li>
          <li><strong>Right to erasure:</strong> delete your account and data</li>
          <li><strong>Right to data portability:</strong> export your data in JSON format</li>
          <li><strong>Right to object:</strong> object to the processing of your data</li>
          <li><strong>Right to withdraw consent:</strong> withdraw your consent at any time</li>
        </ul>
        <p className="mt-2">You can exercise these rights from your profile (data export and deletion) or by contacting us at <strong>contact@mockexamcenter.com</strong>.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Cookies</h2>
        <p>We only use essential cookies necessary for the site to function:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Authentication token:</strong> to maintain your session</li>
          <li><strong>Language preference:</strong> to remember your language choice</li>
          <li><strong>Cookie consent:</strong> to remember your choice</li>
        </ul>
        <p>No tracking or advertising cookies are used.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your data, including password encryption and secure connections (HTTPS).</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Complaints</h2>
        <p>If you believe that the processing of your data does not comply with GDPR, you can file a complaint with the relevant data protection authority in your country.</p>
      </section>
    </div>
  );
}

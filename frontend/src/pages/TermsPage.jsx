import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { LangSwitcher } from '../components/LangSwitcher';
import { Footer } from '../components/Footer';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TermsPage() {
  const { lang, t } = useLang();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="terms-page">
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

        <h1 className="text-3xl font-bold mb-2">{t('terms.title')}</h1>
        <p className="text-gray-500 mb-8">{t('terms.lastUpdate')} : 15 mars 2026</p>

        {lang === 'fr' ? <TermsFR /> : <TermsEN />}
      </main>
      <Footer />
    </div>
  );
}

function TermsFR() {
  return (
    <div className="prose prose-gray max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">1. Objet</h2>
        <p>Les présentes conditions générales d'utilisation régissent l'accès et l'utilisation de la plateforme MockExamCenter, un service de préparation aux examens de certification.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Inscription</h2>
        <p>L'inscription est gratuite et nécessite de fournir un nom, une adresse email valide et un mot de passe. L'utilisateur est responsable de la confidentialité de ses identifiants.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Services proposés</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Aperçu gratuit :</strong> 10 questions gratuites par examen</li>
          <li><strong>Accès payant :</strong> accès complet à un examen ou à tous les examens via paiement PayPal</li>
          <li><strong>Coupons :</strong> des codes promotionnels peuvent être utilisés pour obtenir des réductions</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Paiement et remboursement</h2>
        <p>Les paiements sont traités par PayPal. L'accès est activé immédiatement après le paiement. En raison de la nature numérique du service, aucun remboursement n'est possible une fois l'accès activé, sauf disposition légale contraire.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Propriété intellectuelle</h2>
        <p>Tous les contenus (questions, explications, interfaces) sont la propriété de MockExamCenter. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Responsabilité</h2>
        <p>MockExamCenter fournit des questions d'entraînement à titre éducatif. Nous ne garantissons pas la réussite aux examens de certification officiels. Le service est fourni "en l'état".</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Protection des données</h2>
        <p>Le traitement de vos données personnelles est décrit dans notre <Link to="/privacy" className="text-blue-600 hover:underline">politique de confidentialité</Link>. En utilisant nos services, vous acceptez les termes de cette politique.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Résiliation</h2>
        <p>Vous pouvez supprimer votre compte à tout moment depuis votre profil. La suppression entraîne l'effacement définitif de toutes vos données et la perte de vos accès.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Modification des conditions</h2>
        <p>MockExamCenter se réserve le droit de modifier ces conditions. Les utilisateurs seront informés de toute modification significative.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Droit applicable</h2>
        <p>Les présentes conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents.</p>
      </section>
    </div>
  );
}

function TermsEN() {
  return (
    <div className="prose prose-gray max-w-none space-y-6">
      <section>
        <h2 className="text-xl font-semibold">1. Purpose</h2>
        <p>These terms of use govern access to and use of the MockExamCenter platform, a certification exam preparation service.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">2. Registration</h2>
        <p>Registration is free and requires providing a name, valid email address, and password. Users are responsible for keeping their credentials confidential.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">3. Services Offered</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Free preview:</strong> 10 free questions per exam</li>
          <li><strong>Paid access:</strong> full access to one exam or all exams via PayPal payment</li>
          <li><strong>Coupons:</strong> promotional codes can be used to get discounts</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">4. Payment and Refunds</h2>
        <p>Payments are processed by PayPal. Access is activated immediately after payment. Due to the digital nature of the service, no refunds are possible once access is activated, unless required by law.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">5. Intellectual Property</h2>
        <p>All content (questions, explanations, interfaces) is the property of MockExamCenter. Any unauthorized reproduction, distribution, or use is strictly prohibited.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">6. Liability</h2>
        <p>MockExamCenter provides practice questions for educational purposes. We do not guarantee success in official certification exams. The service is provided "as is".</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">7. Data Protection</h2>
        <p>The processing of your personal data is described in our <Link to="/privacy" className="text-blue-600 hover:underline">privacy policy</Link>. By using our services, you accept the terms of this policy.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">8. Termination</h2>
        <p>You can delete your account at any time from your profile. Deletion results in the permanent erasure of all your data and loss of access.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
        <p>MockExamCenter reserves the right to modify these terms. Users will be notified of any significant changes.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">10. Applicable Law</h2>
        <p>These terms are governed by French law. Any dispute shall be submitted to the competent courts.</p>
      </section>
    </div>
  );
}

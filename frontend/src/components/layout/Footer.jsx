// src/components/layout/Footer.jsx
// Clean civic footer component.

export const Footer = () => {
  return (
    <footer className="civic-footer mt-auto py-4">
      <div className="container">
        <div className="row g-3 align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <h6 className="text-white mb-1">CivicPulse — Smart Governance Platform</h6>
            <p className="text-white-50 mb-0 small">
              Official Citizen Grievance & Municipal Service Delivery Portal.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end text-white-50 small">
            <div>Transparent Governance • Accountable Service • Verified Resolution</div>
            <div className="mt-1">&copy; {new Date().getFullYear()} CivicPulse. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

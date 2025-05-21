import React, {useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
// Replace MUI icons with simple icon components to avoid dependency issues
import {
  VisibilityIcon as SendIcon,
  VisibilityIcon as ExpandMoreIcon,
  VisibilityIcon as RefreshIcon,
  VisibilityIcon as PersonIcon,
  VisibilityIcon as EmailIcon,
  VisibilityIcon as NotificationsIcon,
  VisibilityIcon as SmsIcon
} from '../../ui/SimpleIcons';
import {NotificationTemplateType } from '../../../types/notification-templates.types';
import {
  getEmailTemplateByType,
  getNotificationTemplateByType,
  renderEmailTemplate
} from '../../../services/notificationTemplateService';
import {getUserById } from '../../../services/userService';
import {sendNotificationByType } from '../../../services/notificationSchedulerService';

interface NotificationTestingToolProps {
  onClose?: () => void;
}

const NotificationTestingTool: React.FC<NotificationTestingToolProps> = ({onClose }) => {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationTemplateType>('course_progress');
  const [customData, setCustomData] = useState<Record<string, string>>({
    courseName: 'Sample Course',
    courseProgress: '75%',
    completionDate: new Date().toLocaleDateString(),
    certificateUrl: 'https://example.com/certificate/test'
});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [channels, setChannels] = useState({
    email: true,
    inApp: true,
    push: false,
    sms: false
});
  const [bypassPreferences, setBypassPreferences] = useState(false);
  const [bypassDoNotDisturb, setBypassDoNotDisturb] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
} | null>(null);

  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    htmlContent: string;
    textContent: string;
    previewText?: string;
} | null>(null);

  const [notificationPreview, setNotificationPreview] = useState<{
    title: string;
    message: string;
} | null>(null);

  const [loadingPreview, setLoadingPreview] = useState(false);

  const templateTypes: {value: NotificationTemplateType; label: string }[] = [
    {value: 'course_progress', label: 'Course Progress'},
    {value: 'course_completion', label: 'Course Completion'},
    {value: 'certificate_expiration', label: 'Certificate Expiration'},
    {value: 'new_course_available', label: 'New Course Available'},
    {value: 'inactivity_reminder', label: 'Inactivity Reminder'},
    {value: 'enrollment_confirmation', label: 'Enrollment Confirmation'},
    {value: 'quiz_completion', label: 'Quiz Completion'},
    {value: 'achievement_unlocked', label: 'Achievement Unlocked'},
    {value: 'welcome_message', label: 'Welcome Message'}
  ];

  const handleAddCustomData = () => {
    if (newKey && newValue) {
      setCustomData(prev => ({
        ...prev,
        [newKey]: newValue
    }));
      setNewKey('');
      setNewValue('');
  }
};

  const handleRemoveCustomData = (key: string) => {
    setCustomData(prev => {
      const newData = {...prev };
      delete newData[key];
      return newData;
  });
};

  const handleUserLookup = async () => {
    if (!userId) return;

    try {
      setLoadingPreview(true);
      const user = await getUserById(userId);

      if (user) {
        setEmail(user.email);

        // Add user data to custom data
        setCustomData(prev => ({
          ...prev,
          firstName: user.firstName || user.displayName?.split(' ')[0] || 'User',
          lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email
      }));
    } else {
        setResult({
          success: false,
          message: 'User not found',
          details: `No user found with ID: ${userId}`
      });
    }
  } catch (error) {
      console.error('Error looking up user:', error);
      setResult({
        success: false,
        message: 'Error looking up user',
        details: error instanceof Error ? error.message : String(error)
    });
  } finally {
      setLoadingPreview(false);
  }
};

  const generatePreview = async () => {
    try {
      setLoadingPreview(true);
      setEmailPreview(null);
      setNotificationPreview(null);

      // Get email template
      const emailTemplate = await getEmailTemplateByType(notificationType);

      if (emailTemplate) {
        const rendered = renderEmailTemplate(emailTemplate, customData);
        setEmailPreview(rendered);
    }

      // Get notification template
      const notificationTemplate = await getNotificationTemplateByType(notificationType);

      if (notificationTemplate) {
        // Simple variable replacement for preview
        let title = notificationTemplate.title;
        let message = notificationTemplate.message;

        Object.entries(customData).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          title = title.replace(regex, value);
          message = message.replace(regex, value);
      });

        setNotificationPreview({title, message });
    }
  } catch (error) {
      console.error('Error generating preview:', error);
      setResult({
        success: false,
        message: 'Error generating preview',
        details: error instanceof Error ? error.message : String(error)
    });
  } finally {
      setLoadingPreview(false);
  }
};

  const handleSendTest = async () => {
    if (!userId && !email) {
      setResult({
        success: false,
        message: 'Missing recipient',
        details: 'Please provide either a user ID or an email address'
    });
      return;
  }

    try {
      setLoading(true);
      setResult(null);

      // If only email is provided, add it to custom data
      if (!userId && email) {
        setCustomData(prev => ({
          ...prev,
          email
      }));
    }

      // Send notification
      const success = await sendNotificationByType(
        userId || email, // If userId is not provided, use email as the recipient ID
        notificationType,
        {
          ...customData,
          // Add any additional data needed for the notification
          title: notificationPreview?.title,
          message: notificationPreview?.message
      },
        {
          bypassPreferences,
          bypassDoNotDisturb
      }
      );

      if (success) {
        setResult({
          success: true,
          message: 'Test notification sent successfully',
          details: `Notification of type "${notificationType}" sent to ${userId ? `user ID: ${userId}` : `email: ${email}`}`
      });
    } else {
        setResult({
          success: false,
          message: 'Failed to send test notification',
          details: 'The notification service returned a failure. Check the console for more details.'
      });
    }
  } catch (error) {
      console.error('Error sending test notification:', error);
      setResult({
        success: false,
        message: 'Error sending test notification',
        details: error instanceof Error ? error.message : String(error)
    });
  } finally {
      setLoading(false);
  }
};

  // Generate preview when notification type or custom data changes
  useEffect(() => {
    if (notificationType) {
      generatePreview();
  }
}, [notificationType, customData]);

  return (
    <Paper sx={{p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Notification Testing Tool
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Use this tool to test notification delivery without affecting production data or triggering actual notification schedules.
      </Typography>

      <Divider sx={{my: 2 }} />

      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Notification Configuration
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel id="notification-type-label">Notification Type</InputLabel>
            <Select
              labelId="notification-type-label"
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value as NotificationTemplateType)}
              label="Notification Type"
            >
              {templateTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{mt: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recipient
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  helperText="Enter user ID to test with a specific user"
                  InputProps={{
                    endAdornment: (
                      <Button
                        size="small"
                        onClick={handleUserLookup}
                        disabled={!userId || loadingPreview}
                      >
                        {loadingPreview ? <CircularProgress size={20} /> : 'Lookup'}
                      </Button>
                    )
                }}
                />
              </Grid>
              <Grid size={{xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText="Or enter email for a test recipient"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Delivery Channels
            </Typography>

            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.email}
                    onChange={(e) => setChannels({...channels, email: e.target.checked })}
                    icon={<EmailIcon />}
                    checkedIcon={<EmailIcon />}
                  />
              }
                label="Email"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.inApp}
                    onChange={(e) => setChannels({...channels, inApp: e.target.checked })}
                    icon={<NotificationsIcon />}
                    checkedIcon={<NotificationsIcon />}
                  />
              }
                label="In-App"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.push}
                    onChange={(e) => setChannels({...channels, push: e.target.checked })}
                    icon={<NotificationsIcon />}
                    checkedIcon={<NotificationsIcon />}
                    disabled
                  />
              }
                label="Push"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={channels.sms}
                    onChange={(e) => setChannels({...channels, sms: e.target.checked })}
                    icon={<SmsIcon />}
                    checkedIcon={<SmsIcon />}
                    disabled
                  />
              }
                label="SMS"
              />
            </Box>
          </Box>

          <Box sx={{mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Advanced Options
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={bypassPreferences}
                  onChange={(e) => setBypassPreferences(e.target.checked)}
                />
            }
              label="Bypass user notification preferences"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={bypassDoNotDisturb}
                  onChange={(e) => setBypassDoNotDisturb(e.target.checked)}
                />
            }
              label="Bypass Do Not Disturb settings"
            />
          </Box>

          <Accordion sx={{mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Custom Data Variables</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="textSecondary" paragraph>
                Add custom data variables to be used in the notification templates.
              </Typography>

              <Grid container spacing={2} sx={{mb: 2 }}>
                <Grid size={{xs: 12, sm: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Variable Name"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g., courseName"
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="e.g., Introduction to React"
                  />
                </Grid>
                <Grid size={{xs: 12, sm: 2 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddCustomData}
                    disabled={!newKey || !newValue}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(customData).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    onDelete={() => handleRemoveCustomData(key)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Button
                startIcon={<RefreshIcon />}
                onClick={generatePreview}
                sx={{mt: 2 }}
                disabled={loadingPreview}
              >
                Refresh Preview
              </Button>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid size={{xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Notification Preview
          </Typography>

          {loadingPreview ? (
            <Box sx={{display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {notificationPreview && (
                <Paper variant="outlined" sx={{p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    In-App Notification
                  </Typography>
                  <Box sx={{bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {notificationPreview.title}
                    </Typography>
                    <Typography variant="body2">
                      {notificationPreview.message}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {emailPreview && (
                <Paper variant="outlined" sx={{p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Email Notification
                  </Typography>
                  <Box sx={{bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Subject:
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {emailPreview.subject}
                    </Typography>

                    {emailPreview.previewText && (
                      <>
                        <Typography variant="subtitle2" color="textSecondary">
                          Preview Text:
                        </Typography>
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {emailPreview.previewText}
                        </Typography>
                      </>
                    )}

                    <Divider sx={{my: 1 }} />

                    <Typography variant="subtitle2" color="textSecondary">
                      Body:
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        maxHeight: '300px',
                        overflow: 'auto'
                    }}
                      dangerouslySetInnerHTML={{__html: emailPreview.htmlContent }}
                    />
                  </Box>
                </Paper>
              )}

              {!notificationPreview && !emailPreview && (
                <Alert severity="info">
                  No templates found for the selected notification type. Please select a different type or check that templates exist.
                </Alert>
              )}
            </>
          )}
        </Grid>
      </Grid>

      <Divider sx={{my: 3 }} />

      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {result && (
          <Alert
            severity={result.success ? 'success' : 'error'}
            sx={{flexGrow: 1, mr: 2 }}
          >
            <Typography variant="subtitle2">{result.message}</Typography>
            {result.details && (
              <Typography variant="body2">{result.details}</Typography>
            )}
          </Alert>
        )}

        <Box sx={{display: 'flex', gap: 2 }}>
          {onClose && (
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            onClick={handleSendTest}
            disabled={loading || (!userId && !email) || (!channels.email && !channels.inApp && !channels.push && !channels.sms)}
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default NotificationTestingTool;

